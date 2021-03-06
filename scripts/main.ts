type Context = CanvasRenderingContext2D;
type Canvas = HTMLCanvasElement;

interface CanvasRenderingContext2D {
    drawString(text: string, x: number, y: number, size: number, font: string, colour: Colour, align: Align): void;
    measureString(text: string, size: number, font: string): TextMetrics;
    drawRect(x: number, y: number, w: number, h: number, colour: Colour, fill: boolean): void;
}

let game: Game;
let images = {} as Record<ImageNames, HTMLImageElement>;

function main() {
    CanvasRenderingContext2D.prototype.drawString = function (text: string, x: number, y: number, size: number, font: string, colour: Colour, align: Align) {
        const context = this as Context;

        context.fillStyle = colour.getHexString();
        context.font = `${size}px ${font}`;

        const width = context.measureText(text).width;
        const height = size;

        //TODO: look into CanvasTextAlign and CanvasTextBaseline

        let actualX = x;
        let actualY = y;

        if (align === Align.Bottom
            || align === Align.BottomLeft
            || align === Align.BottomRight)
            actualY = y + height;
        else if (align === Align.Left
            || align === Align.Center
            || align === Align.Right)
            actualY = y + height / 2;

        if (align === Align.Top
            || align === Align.Center
            || align === Align.Bottom)
            actualX = x + width / 2;
        else if (align === Align.TopRight
            || align === Align.Right
            || align === Align.BottomRight)
            actualX = x + width;

        context.fillText(text, actualX, actualY);
    }

    CanvasRenderingContext2D.prototype.measureString = function (text: string, size: number, font: string) {
        const context = this as Context;

        context.font = `${size}px ${font}`;
        return context.measureText(text);
    }

    CanvasRenderingContext2D.prototype.drawRect = function (x: number, y: number, w: number, h: number, colour: Colour, fill: boolean = false) {
        const context = this as Context;

        if (fill) {
            context.fillStyle = colour.getHexString();
            context.fillRect(x, y, w, h);
        }
        else {
            context.strokeStyle = colour.getHexString();
            context.strokeRect(x, y, w, h);
        }
    }

    game = new Game();

    game.init();

    game.startUpdating();

    game.startDrawing();
}

class Game {
    canvas: Canvas;
    context: Context;

    input: Input;
    grid: Grid;
    points: Points;
    blockTray: BlockTray;
    upgradeTray: UpgradeTray;
    tooltip: Tooltip;
    titleBar: TitleBar;

    blocks: BlockInfo[];
    blocksDict = {} as Record<BlockType, BlockInfo>;
    upgrades: UpgradeInfo[];
    upgradesDict = {} as Record<Upgrade, UpgradeInfo>;

    images = {} as Record<ImageNames, HTMLImageElement>;

    updateInterval = 1000 / 60;
    drawInterval = 1000 / 60;

    width: number;
    height: number;

    colours = {
        background: new Colour(0, 80, 80),
        textNormal: new Colour(160, 160, 160),
        textGood: new Colour(0, 160, 0),
        textBad: new Colour(160, 0, 0),
        boxNormal: new Colour(160, 160, 160),
        boxGood: new Colour(0, 160, 0),
        boxBad: new Colour(160, 0, 0),
    }

    fonts = {
        default: 'Arial'
    }

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as Canvas;
        this.context = this.canvas.getContext('2d');

        this.updateWindowSize();
        window.addEventListener('resize', () => this.updateWindowSize());
    }

    init() {
        this.setupBlocks();

        this.setupUpgrades();

        this.input = new Input(this.canvas);

        this.points = new Points();

        this.grid = new Grid();
        this.grid.init();

        this.blockTray = new BlockTray();

        this.upgradeTray = new UpgradeTray();

        this.titleBar = new TitleBar();
    }

    update() {
        this.tooltip = null;

        this.input.update();

        this.grid.update();

        this.blockTray.update();

        this.upgradeTray.update();

        this.points.update();
    }

    draw() {
        this.context.clearRect(0, 0, this.width, this.height);

        this.titleBar.draw(this.context);

        this.points.draw(this.context);

        this.grid.draw(this.context);

        this.blockTray.draw(this.context);

        this.upgradeTray.draw(this.context);

        if (this.tooltip != null) {
            this.tooltip.draw(this.context);
        }
    }

    startUpdating() {
        setInterval(() => this.update(), this.updateInterval);
    }

    startDrawing() {
        setInterval(() => this.draw(), this.drawInterval);
    }

    setupBlocks() {
        this.blocks = [
            new BlockInfo(BlockType.Incrementor, 10, 'Incrementor', 'I', 'Generates {{magnitude}} point{{plural}} per second.', 1, true),
            new BlockInfo(BlockType.Adder, 20, 'Adder', 'A', 'Increases the points generated by adjacent incrementors by {{magnitude}}.', 1),
            new BlockInfo(BlockType.Doubler, 30, 'Doubler', 'D', 'Increases the effectiveness of adjacent Adders by {{magnitude}}x', 2),
            new BlockInfo(BlockType.EdgeCase, 40, 'Edge Case', 'E', 'Increases points per second by {{magnitude}}% for each adjacent grid edge.', 5),
            new BlockInfo(BlockType.VoidIncrementor, 50, 'Void Incrementor', 'V', 'Generates {{magnitude}} point{{plural}} for each adjacent grid edge or empty cell.', 1),
            new BlockInfo(BlockType.Recursor, 60, 'Recursor', 'R', 'Increases adjacent Doubler multipliers by {{magnitude}}% for each adjacent incrementor.', 50), //Description isn't very clear
            new BlockInfo(BlockType.Inheritor, 70, 'Inheritor', 'N', 'Copies the points generated from all adjacent incrementors.', 0),
        ];

        this.blocks.forEach(x => this.blocksDict[x.type] = x);
    }

    setupUpgrades() {
        this.upgrades = [
            new UpgradeInfo(Upgrade.GridSize1, 20, 'Bigger grid', 'Increases the size of the grid by 1.', '+', UpgradeEffect.BiggerGrid),
            new UpgradeInfo(Upgrade.GridSize2, 200, 'Even bigger grid', 'Increases the size of the grid by 1.', '+', UpgradeEffect.BiggerGrid, Upgrade.GridSize1),
            new UpgradeInfo(Upgrade.GridSize3, 2000, 'Even even bigger grid', 'Increases the size of the grid by 1.', '+', UpgradeEffect.BiggerGrid, Upgrade.GridSize2),
            new UpgradeInfo(Upgrade.GridSize4, 20000, 'Mega grid', 'Increases the size of the grid by 1.', '+', UpgradeEffect.BiggerGrid, Upgrade.GridSize3),
            new UpgradeInfo(Upgrade.GridSize5, 200000, 'Ultra grid', 'Increases the size of the grid by 1.', '+', UpgradeEffect.BiggerGrid, Upgrade.GridSize4),
            new UpgradeInfo(Upgrade.GridSize6, 2000000, 'Hyper grid', 'Increases the size of the grid by 1.', '+', UpgradeEffect.BiggerGrid, Upgrade.GridSize5),

            new UpgradeInfo(Upgrade.UnlockAdder, 100, 'Unlock Adders', 'Allows the Adder block to be bought and placed.', 'A', UpgradeEffect.UnlockAdder, Upgrade.GridSize1),
            new UpgradeInfo(Upgrade.UnlockDoubler, 1000, 'Unlock Doublers', 'Allows the Doubler block to be bought and placed.', 'D', UpgradeEffect.UnlockDoubler, Upgrade.GridSize2),
            new UpgradeInfo(Upgrade.UnlockEdgeCase, 10000, 'Unlock Edge Cases', 'Allows the Edge Case block to be bought and placed.', 'E', UpgradeEffect.UnlockEdgeCase, Upgrade.GridSize3),
            new UpgradeInfo(Upgrade.UnlockVoidIncrementor, 100000, 'Unlock Void Incrementors', 'Allows the Void Incrementor block to be bought and placed.', 'V', UpgradeEffect.UnlockVoidIncrementor, Upgrade.GridSize4),
            new UpgradeInfo(Upgrade.UnlockRecursor, 1000000, 'Unlock Recursors', 'Allows the Recursor block to be bought and placed.', 'R', UpgradeEffect.UnlockRecursor, Upgrade.GridSize5),
            new UpgradeInfo(Upgrade.UnlockInheritor, 10000000, 'Unlock Inheritors', 'Allows the Inheritor block to be bought and placed.', 'N', UpgradeEffect.UnlockInheritor, Upgrade.GridSize6),

            new UpgradeInfo(Upgrade.DoubleIncrementors1, 100, 'Better Incrementors', 'Doubles the base points generated by Incrementors.', '2', UpgradeEffect.DoubleIncrementors, Upgrade.GridSize1),
            new UpgradeInfo(Upgrade.DoubleIncrementors2, 1000, 'Even better Incrementors', 'Doubles the base points generated by Incrementors.', '2', UpgradeEffect.DoubleIncrementors, Upgrade.DoubleIncrementors1),
            new UpgradeInfo(Upgrade.DoubleIncrementors3, 10000, 'Even even better Incrementors', 'Doubles the base points generated by Incrementors.', '2', UpgradeEffect.DoubleIncrementors, Upgrade.DoubleIncrementors2),
            new UpgradeInfo(Upgrade.DoubleIncrementors4, 100000, 'Mega Incrementors', 'Doubles the base points generated by Incrementors.', '2', UpgradeEffect.DoubleIncrementors, Upgrade.DoubleIncrementors3),

            new UpgradeInfo(Upgrade.DoubleAdders1, 2000, 'Better Adders', 'Doubles the points given to adjacent incrementors.', '2', UpgradeEffect.DoubleAdders, Upgrade.UnlockAdder),
            new UpgradeInfo(Upgrade.DoubleAdders2, 20000, 'Even better Adders', 'Doubles the points given to adjacent incrementors.', '2', UpgradeEffect.DoubleAdders, Upgrade.DoubleAdders1),
            new UpgradeInfo(Upgrade.DoubleAdders3, 200000, 'Even even better Adders', 'Doubles the points given to adjacent incrementors.', '2', UpgradeEffect.DoubleAdders, Upgrade.DoubleAdders2),
            new UpgradeInfo(Upgrade.DoubleAdders4, 2000000, 'Mega Adders', 'Doubles the points given to adjacent incrementors.', '2', UpgradeEffect.DoubleAdders, Upgrade.DoubleAdders3),

            new UpgradeInfo(Upgrade.DoubleVoidIncrementors1, 5000, 'Better Void Incrementors', 'Doubles the base points generated by Void Incrementors.', '2', UpgradeEffect.DoubleVoidIncrementors, Upgrade.UnlockVoidIncrementor),
            new UpgradeInfo(Upgrade.DoubleVoidIncrementors2, 50000, 'Even better Void Incrementors', 'Doubles the base points generated by Void Incrementors.', '2', UpgradeEffect.DoubleVoidIncrementors, Upgrade.DoubleVoidIncrementors1),
            new UpgradeInfo(Upgrade.DoubleVoidIncrementors3, 500000, 'Even even better Void Incrementors', 'Doubles the base points generated by Void Incrementors.', '2', UpgradeEffect.DoubleVoidIncrementors, Upgrade.DoubleVoidIncrementors2),
            new UpgradeInfo(Upgrade.DoubleVoidIncrementors4, 5000000, 'Mega Void Incrementors', 'Doubles the base points generated by Void Incrementors.', '2', UpgradeEffect.DoubleVoidIncrementors, Upgrade.DoubleVoidIncrementors3),
        ].sort((x, y) => x.cost - y.cost);

        this.upgrades.forEach(x => {
            this.upgradesDict[x.id] = x;
            x.init();
        });
    }

    getBlockInfo(blockType: BlockType) {
        return this.blocks.filter(x => x.type === blockType)[0];
    }

    getUpgradeInfo(upgrade: Upgrade) {
        return this.upgrades.filter(x => x.id === upgrade)[0];
    }

    updateWindowSize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
    }
}

class MouseState {
    constructor(
        public x: number,
        public y: number,
        public left: boolean,
        public right: boolean,
    ) { }
}

class Input {
    private previousMouseState: MouseState;
    private currentMouseState: MouseState;
    private runningMouseState: MouseState

    constructor(canvas: Canvas) {
        this.previousMouseState = new MouseState(0, 0, false, false);
        this.currentMouseState = new MouseState(0, 0, false, false);
        this.runningMouseState = new MouseState(0, 0, false, false);

        canvas.addEventListener('mousedown', (event) => {
            if (event.button === MouseButton.Left)
                this.runningMouseState.left = true;
            else if (event.button === MouseButton.Right)
                this.runningMouseState.right = true;
        });
        canvas.addEventListener('mouseup', (event) => {
            if (event.button === MouseButton.Left)
                this.runningMouseState.left = false;
            else if (event.button === MouseButton.Right)
                this.runningMouseState.right = false;
        });
        canvas.addEventListener('mousemove', (event) => {
            const target = event.currentTarget as Element;
            const rect = target.getBoundingClientRect();
            this.runningMouseState.x = event.clientX - rect.left;
            this.runningMouseState.y = event.clientY - rect.top;
        });
        canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    }

    update() {
        this.previousMouseState = this.currentMouseState;
        this.currentMouseState = new MouseState(
            this.runningMouseState.x,
            this.runningMouseState.y,
            this.runningMouseState.left,
            this.runningMouseState.right);
    }

    getX() {
        return this.currentMouseState.x;
    }

    getY() {
        return this.currentMouseState.y;
    }

    isUp(mouseButton: MouseButton) {
        if (mouseButton === MouseButton.Left)
            return !this.currentMouseState.left;
        if (mouseButton === MouseButton.Right)
            return !this.currentMouseState.right;
        return false;
    }

    isDown(mouseButton: MouseButton) {
        if (mouseButton === MouseButton.Left)
            return this.currentMouseState.left;
        if (mouseButton === MouseButton.Right)
            return this.currentMouseState.right;
        return false;
    }

    isClicked(mouseButton: MouseButton) {
        if (mouseButton === MouseButton.Left)
            return this.currentMouseState.left && !this.previousMouseState.left
        if (mouseButton === MouseButton.Right)
            return this.currentMouseState.right && !this.previousMouseState.right;
        return false;
    }

    isReleased(mouseButton: MouseButton) {
        if (mouseButton === MouseButton.Left)
            return !this.currentMouseState.left && this.previousMouseState.left
        if (mouseButton === MouseButton.Right)
            return !this.currentMouseState.right && this.previousMouseState.right;
        return false;
    }
}

class Grid {
    width = 1;
    height = 1;
    offsetX = 15;
    offsetY = 50;
    padding = 5;
    size = 50;
    paddedSize = this.size - this.padding;
    paddedOffsetX = this.offsetX + this.padding;
    paddedOffsetY = this.offsetY + this.padding;

    grid: BlockType[][];

    init() {
        this.grid = [];
        for (let x = 0; x < this.width; x++) {
            const arr: BlockType[] = [];
            for (let y = 0; y < this.height; y++) {
                arr.push(BlockType.Empty);
            }
            this.grid.push(arr);
        }
    }

    update() {
        const input = game.input;
        const inputX = input.getX();
        const inputY = input.getY();

        if (input.isClicked(MouseButton.Left) && game.blockTray.canPurchase()) {
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    if (this.grid[x][y] === BlockType.Empty && pointWithinRectangle(inputX, inputY,
                        this.paddedOffsetX + x * this.size,
                        this.paddedOffsetY + y * this.size,
                        this.paddedSize, this.paddedSize)) {
                        this.grid[x][y] = game.blockTray.purchase();
                        this.updatePointsPerTick();
                    }
                }
            }
        }

        if (input.isClicked(MouseButton.Right)) {
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    if (this.grid[x][y] !== BlockType.Empty && pointWithinRectangle(inputX, inputY,
                        this.paddedOffsetX + x * this.size,
                        this.paddedOffsetY + y * this.size,
                        this.paddedSize, this.paddedSize)) {
                        this.grid[x][y] = BlockType.Empty;
                        this.updatePointsPerTick();
                    }
                }
            }
        }
    }

    draw(context: Context) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {

                const rectX = this.paddedOffsetX + x * this.size;
                const rectY = this.paddedOffsetY + y * this.size;

                context.drawRect(rectX, rectY, this.paddedSize, this.paddedSize, game.colours.boxNormal, false);

                const cell = this.grid[x][y];
                if (cell !== BlockType.Empty) {
                    const block = game.blocksDict[cell] as BlockInfo;
                    context.drawString(block.char, rectX + 10, rectY + 35, 30, game.fonts.default, game.colours.textNormal, Align.Default);
                }
            }
        }
    }

    adjustGridSize() {
        for (let x = 0; x < this.width; x++) {
            if (this.grid.length > x) {
                const arr = this.grid[x];
                for (let toAdd = this.height - arr.length; toAdd--; toAdd > 0) {
                    arr.push(BlockType.Empty);
                }
                this.grid[x] = arr;
            }
            else {
                const arr = [];
                for (let y = 0; y < this.height; y++) {
                    arr.push(BlockType.Empty);
                }
                this.grid.push(arr);
            }
        }

        this.updatePointsPerTick();
    }

    updatePointsPerTick() {
        const pointGrid: number[][] = [];
        const adderGrid: number[][] = [];

        const incrementorBlock = game.getBlockInfo(BlockType.Incrementor);
        const voidIncrementorBlock = game.getBlockInfo(BlockType.VoidIncrementor);

        for (let x = 0; x < this.width; x++) {
            const arr: number[] = [];
            for (let y = 0; y < this.height; y++) {
                const blockType = this.grid[x][y];
                if (blockType === BlockType.Incrementor)
                    arr.push(incrementorBlock.magnitude);
                else if (blockType === BlockType.VoidIncrementor)
                    arr.push(this.getVoidPoints(x, y, voidIncrementorBlock.magnitude));
                else
                    arr.push(0);
            }
            pointGrid.push(arr);
        }

        const adderBlock = game.getBlockInfo(BlockType.Adder);

        for (let x = 0; x < this.width; x++) {
            const arr: number[] = [];
            for (let y = 0; y < this.height; y++) {
                arr.push(this.grid[x][y] === BlockType.Adder ? adderBlock.magnitude : 0);
            }
            adderGrid.push(arr);
        }

        const recursorBlock = game.getBlockInfo(BlockType.Recursor);
        const recursorMagnitude = recursorBlock.magnitude / 100;
        let multiplierGrid = createMultidimensionalArray(this.width, this.height, 0);
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.grid[x][y] === BlockType.Recursor)
                    multiplierGrid[x][y] = recursorMagnitude * this.getAdjacentIncrementors(x, y);
            }
        }

        const doublerBlock = game.getBlockInfo(BlockType.Doubler);
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.grid[x][y] === BlockType.Doubler) {
                    const multiplier = this.getMultiplierValue(x, y, multiplierGrid, doublerBlock.magnitude);
                    this.tryMultiplyCoord(x - 1, y, multiplier, adderGrid);
                    this.tryMultiplyCoord(x + 1, y, multiplier, adderGrid);
                    this.tryMultiplyCoord(x, y - 1, multiplier, adderGrid);
                    this.tryMultiplyCoord(x, y + 1, multiplier, adderGrid);
                }
            }
        }

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.grid[x][y] === BlockType.Adder) {
                    this.tryIncrementCoord(x - 1, y, pointGrid, adderGrid[x][y]);
                    this.tryIncrementCoord(x + 1, y, pointGrid, adderGrid[x][y]);
                    this.tryIncrementCoord(x, y - 1, pointGrid, adderGrid[x][y]);
                    this.tryIncrementCoord(x, y + 1, pointGrid, adderGrid[x][y]);
                }
            }
        }

        let pointGridWithInheritors = createMultidimensionalArray(this.width, this.height, 0);

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.grid[x][y] === BlockType.Inheritor) {
                    pointGridWithInheritors[x][y] = this.getAdjacentPoints(x, y, pointGrid);
                }
                else {
                    pointGridWithInheritors[x][y] = pointGrid[x][y];
                }
            }
        }

        let total = 0;
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                total += pointGridWithInheritors[x][y];
            }
        }

        const edgeCaseBlock = game.getBlockInfo(BlockType.EdgeCase);
        const edgeCaseMagnitude = (edgeCaseBlock.magnitude / 100) + 1;

        let edgeMult = 1;
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.grid[x][y] === BlockType.EdgeCase) {
                    edgeMult *= edgeCaseMagnitude ** this.getEdgesTouched(x, y);
                }
            }
        }
        total *= edgeMult;

        game.points.pointsPerTick = total;
    }

    getBlockTypeOfCoord(x: number, y: number) {
        return x <= -1 || y <= -1 || x >= this.width || y >= this.height ? BlockType.Empty : this.grid[x][y];
    }

    getValueOfCoord(x: number, y: number, grid: number[][]) {
        return x <= -1 || y <= -1 || x >= this.width || y >= this.height ? 0 : grid[x][y];
    }

    tryIncrementCoord(x: number, y: number, grid: number[][], incrementAmount: number) {
        const blockType = this.getBlockTypeOfCoord(x, y);
        if (blockType === BlockType.Incrementor
            || blockType === BlockType.VoidIncrementor) {
            grid[x][y] += incrementAmount;
        }
    }

    getAdjacentPoints(x: number, y: number, grid: number[][]) {
        let points = 0;

        points += this.getValueOfCoord(x - 1, y, grid);
        points += this.getValueOfCoord(x + 1, y, grid);
        points += this.getValueOfCoord(x, y - 1, grid);
        points += this.getValueOfCoord(x, y + 1, grid);

        return points;
    }

    tryMultiplyCoord(x: number, y: number, magnitude: number, grid: number[][]) {
        if (this.getBlockTypeOfCoord(x, y) === BlockType.Adder) {
            grid[x][y] *= magnitude;
        }
    }

    getEdgesTouched(x: number, y: number) {
        let edgesTouched = 0;

        if (x === 0)
            edgesTouched++;
        if (y === 0)
            edgesTouched++;
        if (x === this.width - 1)
            edgesTouched++;
        if (y === this.height - 1)
            edgesTouched++;

        return edgesTouched;
    }

    getVoidPoints(x: number, y: number, magnitude: number) {
        let points = 0;

        if (this.getBlockTypeOfCoord(x - 1, y) === BlockType.Empty)
            points += magnitude;
        if (this.getBlockTypeOfCoord(x + 1, y) === BlockType.Empty)
            points += magnitude;
        if (this.getBlockTypeOfCoord(x, y - 1) === BlockType.Empty)
            points += magnitude;
        if (this.getBlockTypeOfCoord(x, y + 1) === BlockType.Empty)
            points += magnitude;

        return points;
    }

    getAdjacentIncrementors(x: number, y: number) {
        let adjacent = 0;

        const left = this.getBlockTypeOfCoord(x - 1, y)
        const right = this.getBlockTypeOfCoord(x + 1, y)
        const up = this.getBlockTypeOfCoord(x, y - 1)
        const down = this.getBlockTypeOfCoord(x, y + 1)

        if (left === BlockType.Incrementor || left == BlockType.VoidIncrementor)
            adjacent++;
        if (right === BlockType.Incrementor || right == BlockType.VoidIncrementor)
            adjacent++;
        if (up === BlockType.Incrementor || up == BlockType.VoidIncrementor)
            adjacent++;
        if (down === BlockType.Incrementor || down == BlockType.VoidIncrementor)
            adjacent++;

        return adjacent;
    }

    getMultiplierValue(x: number, y: number, grid: number[][], magnitude: number) {
        const totalAdjacent = 1 +
            this.getValueOfCoord(x - 1, y, grid) +
            this.getValueOfCoord(x + 1, y, grid) +
            this.getValueOfCoord(x, y - 1, grid) +
            this.getValueOfCoord(x, y + 1, grid);

        return totalAdjacent * magnitude;
    }
}

class Points {
    points = 10;
    pointsPerTick = 0;
    updateTime = 1000;
    currentTime = 0;

    offsetX = 20;
    offsetY = 260;

    update() {
        this.currentTime += game.updateInterval;
        if (this.currentTime >= this.updateTime) {
            this.currentTime -= this.updateTime;

            this.points += this.pointsPerTick;
        }
    }

    draw(context: Context) {
        context.drawString('Points', this.offsetX, game.height - this.offsetY - 60, 30, game.fonts.default, game.colours.textNormal, Align.Default);
        context.drawString(this.points.toFixed(), this.offsetX, game.height - this.offsetY - 30, 30, game.fonts.default, game.colours.textNormal, Align.Default);
        context.drawString(this.pointsPerTick.toFixed(1) + '/s', this.offsetX, game.height - this.offsetY, 30, game.fonts.default, game.colours.textNormal, Align.Default);
    }
}

class BlockInfo {
    constructor(
        public type: BlockType,
        public cost: number,
        public name: string,
        public char: string,
        public description: string,
        public magnitude: number,
        public unlocked = false
    ) { }

    getDynamicDescription() {
        let desc = this.description;

        desc = desc.replace('{{magnitude}}', this.magnitude.toFixed());
        desc = desc.replace('{{plural}}', this.magnitude === 1 ? '' : 's');

        return desc;
    }
}

class BlockTray {
    blocks: BlockInfo[] = [];
    selected = -1;

    offsetX = 20;
    offsetY = 140;

    update() {
        const input = game.input;

        const x = input.getX();
        const y = input.getY();
        const visibleBlocks = this.getVisibleBlocks();

        for (let i = 0; i < visibleBlocks.length; i++) {
            if (pointWithinRectangle(x, y, this.offsetX + (50 * i), game.height - this.offsetY - 50, 45, 45)) {
                const block = visibleBlocks[i];

                if (input.isClicked(MouseButton.Left)) {
                    this.selected = this.selected === i ? -1 : i;
                }

                game.tooltip = new Tooltip(block.name, block.getDynamicDescription(), x, y, block.cost);
            }
        }
    }

    draw(context: Context) {
        const visibleBlocks = this.getVisibleBlocks();

        for (let i = 0; i < visibleBlocks.length; i++) {
            const block = visibleBlocks[i];

            const selected = i === this.selected;
            const x = this.offsetX + (50 * i);

            context.drawRect(x, game.height - this.offsetY - 50, 45, 45, selected ? game.colours.boxGood : game.colours.boxNormal, false);
            context.drawString(block.char, x + 10, game.height - this.offsetY - 15, 30, game.fonts.default, selected ? game.colours.textGood : game.colours.textNormal, Align.Default);
        }

        context.drawString('Blocks', this.offsetX, game.height - this.offsetY - 65, 30, game.fonts.default, game.colours.textNormal, Align.Default);
    }

    canPurchase() {
        return this.selected !== -1 && game.points.points >= this.getVisibleBlocks()[this.selected].cost;
    }

    purchase() {
        const block = this.getVisibleBlocks()[this.selected];

        game.points.points -= block.cost;

        return block.type;
    }

    getVisibleBlocks() {
        return game.blocks.filter(x => x.unlocked);
    }
}

class UpgradeInfo {
    public purchased = false;
    private pre: UpgradeInfo = null;

    constructor(
        public id: Upgrade,
        public cost: number,
        public name: string,
        public description: string,
        public char: string,
        public effect: UpgradeEffect,
        public preId: Upgrade = null
    ) { }

    init() {
        if (this.preId != null) {
            this.pre = game.getUpgradeInfo(this.preId);
        }
    }

    isVisible() {
        return !this.purchased && (this.preId == null || game.getUpgradeInfo(this.preId).purchased == true);
    }

    action() {
        if (this.effect === UpgradeEffect.BiggerGrid) {
            game.grid.width += 1;
            game.grid.height += 1;
            game.grid.adjustGridSize();
        }
        else if (this.effect === UpgradeEffect.UnlockAdder) {
            game.getBlockInfo(BlockType.Adder).unlocked = true;
        }
        else if (this.effect === UpgradeEffect.UnlockDoubler) {
            game.getBlockInfo(BlockType.Doubler).unlocked = true;
        }
        else if (this.effect === UpgradeEffect.UnlockEdgeCase) {
            game.getBlockInfo(BlockType.EdgeCase).unlocked = true;
        }
        else if (this.effect === UpgradeEffect.UnlockVoidIncrementor) {
            game.getBlockInfo(BlockType.VoidIncrementor).unlocked = true;
        }
        else if (this.effect === UpgradeEffect.UnlockRecursor) {
            game.getBlockInfo(BlockType.Recursor).unlocked = true;
        }
        else if (this.effect === UpgradeEffect.UnlockInheritor) {
            game.getBlockInfo(BlockType.Inheritor).unlocked = true;
        }
        else if (this.effect === UpgradeEffect.DoubleIncrementors) {
            game.getBlockInfo(BlockType.Incrementor).magnitude *= 2;
            game.grid.updatePointsPerTick();
        }
        else if (this.effect === UpgradeEffect.DoubleAdders) {
            game.getBlockInfo(BlockType.Adder).magnitude *= 2;
            game.grid.updatePointsPerTick();
        }
        else if (this.effect === UpgradeEffect.DoubleVoidIncrementors) {
            game.getBlockInfo(BlockType.VoidIncrementor).magnitude *= 2;
            game.grid.updatePointsPerTick();
        }
    }

    purchase() {
        game.points.points -= this.cost;
        this.action();
        this.purchased = true;
    }
}

class UpgradeTray {
    offsetX = 20;
    offsetY = 20;

    update() {
        const input = game.input;

        const x = input.getX();
        const y = input.getY();
        const visibleUpgrades = this.getVisibleUpgrades();

        for (let i = 0; i < visibleUpgrades.length; i++) {
            if (pointWithinRectangle(x, y, this.offsetX + (50 * i), game.height - this.offsetY - 45, 45, 45)) {
                const upgrade = visibleUpgrades[i];

                if (input.isClicked(MouseButton.Left) && upgrade.cost <= game.points.points) {
                    upgrade.purchase();
                }

                game.tooltip = new Tooltip(upgrade.name, upgrade.description, x, y, upgrade.cost);
            }
        }
    }

    draw(context: Context) {
        const visibleUpgrades = this.getVisibleUpgrades();
        for (let i = 0; i < visibleUpgrades.length; i++) {
            const upgrade = visibleUpgrades[i];
            const x = this.offsetX + (50 * i);

            context.drawRect(x, game.height - this.offsetY - 45, 45, 45, game.colours.boxNormal, false);
            context.drawString(upgrade.char, x + 10, game.height - this.offsetY - 10, 30, game.fonts.default, game.colours.textNormal, Align.Default);
        }

        context.drawString('Upgrades', this.offsetX, game.height - this.offsetY - 60, 30, game.fonts.default, game.colours.textNormal, Align.Default);
    }

    getVisibleUpgrades() {
        return game.upgrades.filter(x => x.isVisible());
    }
}

class Tooltip {
    constructor(
        public title: string,
        public text: string,
        public x: number,
        public y: number,
        public cost: number = null,
    ) { }

    draw(context: Context) {
        const height = this.getHeight();
        const top = this.getTop();

        const width = this.getWidth(context);

        context.drawRect(this.x, top, width, height, game.colours.background, true);
        context.drawRect(this.x, top, width, height, game.colours.boxNormal, false);

        context.drawString(this.title, this.x + 5, top + 30, 30, game.fonts.default, game.colours.textNormal, Align.Default);
        context.drawString(this.text, this.x + 5, top + 55, 22, game.fonts.default, game.colours.textNormal, Align.Default);

        if (this.cost != null) {
            context.drawString(this.getCostPrefix(), this.x + 5, top + 80, 22, game.fonts.default, game.colours.textNormal, Align.Default);
            context.drawString(this.cost.toString(), this.x + 5 + this.getCostPrefixWidth(context), top + 80, 22,
                game.fonts.default, this.cost <= game.points.points ? game.colours.textGood : game.colours.textBad, Align.Default);
        }
    }

    getHeight() {
        return this.cost == null ? 60 : 90;
    }

    getTop() {
        return this.y - this.getHeight();
    }

    getCostPrefix() {
        return 'Cost: ';
    }

    getCostPrefixWidth(context: Context) {
        return context.measureText(this.getCostPrefix()).width;
    }

    getWidth(context: Context) {
        const titleWidth = context.measureString(this.title, 30, game.fonts.default).width;
        const textWidth = context.measureString(this.text, 22, game.fonts.default).width;

        if (this.cost == null) {
            return Math.max(titleWidth, textWidth) + 10;
        }

        const costWidth = context.measureString(this.getCostPrefix() + this.cost.toString(), 22, game.fonts.default).width;
        return Math.max(titleWidth, textWidth, costWidth) + 10;
    }
}

class TitleBar {
    draw(context: Context) {
        context.drawString('Blockremental', 20, 20, 30, game.fonts.default, game.colours.textNormal, Align.Left);
    }
}

class Colour {
    private r: number;
    private g: number;
    private b: number;
    private hexString: string;

    getR() { return this.r; }
    getG() { return this.g; }
    getB() { return this.b; }
    getHexString() { return this.hexString; }

    constructor(
        r: number,
        g: number,
        b: number
    ) {
        this.r = this.boundValue(r);
        this.g = this.boundValue(g);
        this.b = this.boundValue(b);

        this.setHexString();
    }

    private setHexString() {
        const rHex = this.r.toString(16);
        const gHex = this.g.toString(16);
        const bHex = this.b.toString(16);

        this.hexString = '#';

        if (rHex.length === 1)
            this.hexString += '0';
        this.hexString += rHex;

        if (gHex.length === 1)
            this.hexString += '0';
        this.hexString += gHex;

        if (bHex.length === 1)
            this.hexString += '0';
        this.hexString += bHex;
    }

    private boundValue(value: number) {
        if (value < 0)
            return 0;
        if (value > 255)
            return 255;
        return value;
    }
}

function pointWithinRectangle(px: number, py: number, rx: number, ry: number, rw: number, rh: number) {
    return px >= rx
        && px <= rx + rw
        && py >= ry
        && py <= ry + rh;
}

function createMultidimensionalArray<TValue>(width: number, height: number, defaultValue: TValue) {
    let multiArray: TValue[][] = [];

    for (let x = 0; x < width; x++) {
        const array: TValue[] = [];
        for (let y = 0; y < height; y++) {
            array.push(defaultValue);
        }
        multiArray.push(array);
    }

    return multiArray;
}

enum BlockType {
    Empty = 0,
    Incrementor = 1,
    Adder = 2,
    Doubler = 3,
    EdgeCase = 4,
    VoidIncrementor = 5,
    Recursor = 6,
    Inheritor = 7,
}

enum Upgrade {
    GridSize1 = 1,
    GridSize2 = 2,
    GridSize3 = 3,
    GridSize4 = 4,
    GridSize5 = 5,
    GridSize6 = 6,
    GridSize7 = 7,
    GridSize8 = 8,
    GridSize9 = 9,

    UnlockAdder = 101,
    UnlockDoubler = 102,
    UnlockEdgeCase = 103,
    UnlockVoidIncrementor = 104,
    UnlockRecursor = 105,
    UnlockInheritor = 106,

    DoubleIncrementors1 = 201,
    DoubleIncrementors2 = 202,
    DoubleIncrementors3 = 203,
    DoubleIncrementors4 = 204,

    DoubleAdders1 = 301,
    DoubleAdders2 = 302,
    DoubleAdders3 = 303,
    DoubleAdders4 = 304,

    DoubleVoidIncrementors1 = 401,
    DoubleVoidIncrementors2 = 402,
    DoubleVoidIncrementors3 = 403,
    DoubleVoidIncrementors4 = 404,
}

enum UpgradeEffect {
    BiggerGrid = 1,

    UnlockAdder = 101,
    UnlockDoubler = 102,
    UnlockEdgeCase = 103,
    UnlockVoidIncrementor = 104,
    UnlockRecursor = 105,
    UnlockInheritor = 106,

    DoubleIncrementors = 201,
    DoubleAdders = 202,
    DoubleVoidIncrementors = 205,
}

enum MouseButton {
    Left = 0,
    Middle = 1,
    Right = 2,
    Back = 3,
    Forward = 4,
}

enum Align {
    Default = 0,
    TopLeft = 1,
    Top = 2,
    TopRight = 3,
    Left = 4,
    Center = 5,
    Right = 6,
    BottomLeft = 7,
    Bottom = 8,
    BottomRight = 9,
}

enum ImageNames {
    Test = 'test',
}

function setupImages() {
    const imageDiv = document.getElementById('images');

    for (let imageName in ImageNames) {
        const image = new Image();
        image.src = 'images/' + ImageNames[imageName] + '.png';
        imageDiv.append(image);
        images[ImageNames[imageName]] = image;
    }
}

setupImages();

window.onload = main;