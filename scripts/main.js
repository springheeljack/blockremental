var game;
function main() {
    game = new Game();
    game.init();
    game.startUpdating();
    game.startDrawing();
}
var Game = /** @class */ (function () {
    function Game() {
        this.blocksDict = {};
        this.upgradesDict = {};
        this.updateInterval = 1000 / 60;
        this.drawInterval = 1000 / 60;
        this.colours = {
            background: '#005555',
            textNormal: '#AAAAAA',
            textGood: '#00AA00',
            textBad: '#AA0000',
            boxNormal: '#AAAAAA',
            boxGood: '#00AA00',
            boxBad: '#AA0000',
        };
        this.fonts = {
            small: '16px Arial',
            medium: '22px Arial',
            large: '30px Arial',
        };
        this.canvas = document.getElementById('gameCanvas');
        this.context = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
    }
    Game.prototype.init = function () {
        this.setupBlocks();
        this.setupUpgrades();
        this.input = new Input(this.canvas);
        this.points = new Points();
        this.grid = new Grid();
        this.grid.init();
        this.blockTray = new BlockTray();
        this.upgradeTray = new UpgradeTray();
    };
    Game.prototype.update = function () {
        this.tooltip = null;
        this.input.update();
        this.grid.update();
        this.blockTray.update();
        this.upgradeTray.update();
        this.points.update();
    };
    Game.prototype.draw = function () {
        this.context.clearRect(0, 0, this.width, this.height);
        this.points.draw(this.context);
        this.grid.draw(this.context);
        this.blockTray.draw(this.context);
        this.upgradeTray.draw(this.context);
        if (this.tooltip != null) {
            this.tooltip.draw(this.context);
        }
    };
    Game.prototype.startUpdating = function () {
        var _this = this;
        setInterval(function () { return _this.update(); }, this.updateInterval);
    };
    Game.prototype.startDrawing = function () {
        var _this = this;
        setInterval(function () { return _this.draw(); }, this.drawInterval);
    };
    Game.prototype.setupBlocks = function () {
        var _this = this;
        this.blocks = [
            new BlockInfo(BlockType.Incrementor, 10, 'Incrementor', 'I', 'Generates 1 point per second.', 1, true),
            new BlockInfo(BlockType.Adder, 20, 'Adder', 'A', 'Increases the points generated by adjacent incrementors by 1.', 1),
            new BlockInfo(BlockType.Doubler, 30, 'Doubler', 'D', 'Doubles the effectiveness of adjacent Adders.', 2),
            new BlockInfo(BlockType.EdgeCase, 40, 'Edge Case', 'E', 'Increases points per second by 5% for each adjacent grid edge.', 1.05),
            new BlockInfo(BlockType.VoidIncrementor, 50, 'Void Incrementor', 'V', 'Generates 1 point for each adjacent grid edge or empty cell.', 1),
        ];
        this.blocks.forEach(function (x) { return _this.blocksDict[x.type] = x; });
    };
    Game.prototype.setupUpgrades = function () {
        var _this = this;
        this.upgrades = [
            new UpgradeInfo(Upgrade.GridSize1, 20, 'Bigger grid', 'Increases the size of the grid by 1.', '+', UpgradeEffect.BiggerGrid),
            new UpgradeInfo(Upgrade.GridSize2, 200, 'Even bigger grid', 'Increases the size of the grid by 1.', '+', UpgradeEffect.BiggerGrid, Upgrade.GridSize1),
            new UpgradeInfo(Upgrade.GridSize3, 2000, 'Even even bigger grid', 'Increases the size of the grid by 1.', '+', UpgradeEffect.BiggerGrid, Upgrade.GridSize2),
            new UpgradeInfo(Upgrade.GridSize4, 20000, 'Mega grid', 'Increases the size of the grid by 1.', '+', UpgradeEffect.BiggerGrid, Upgrade.GridSize3),
            new UpgradeInfo(Upgrade.GridSize5, 200000, 'Ultra grid', 'Increases the size of the grid by 1.', '+', UpgradeEffect.BiggerGrid, Upgrade.GridSize4),
            new UpgradeInfo(Upgrade.UnlockAdder, 100, 'Unlock Adders', 'Allows the Adder block to be bought and placed.', 'A', UpgradeEffect.UnlockAdder, Upgrade.GridSize1),
            new UpgradeInfo(Upgrade.UnlockDoubler, 1000, 'Unlock Doublers', 'Allows the Doubler block to be bought and placed.', 'D', UpgradeEffect.UnlockDoubler, Upgrade.GridSize2),
            new UpgradeInfo(Upgrade.UnlockEdgeCase, 10000, 'Unlock Edge Cases', 'Allows the Edge Case block to be bought and placed.', 'E', UpgradeEffect.UnlockEdgeCase, Upgrade.GridSize3),
            new UpgradeInfo(Upgrade.UnlockVoidIncrementor, 100000, 'Unlock Void Incrementors', 'Allows the Void Incrementor block to be bought and placed.', 'V', UpgradeEffect.UnlockVoidIncrementor, Upgrade.GridSize4),
            new UpgradeInfo(Upgrade.DoubleIncrementors1, 500, 'Double Incrementor generation', 'Doubles the base points generated by Incrementors.', '2', UpgradeEffect.DoubleIncrementors, Upgrade.GridSize1),
            new UpgradeInfo(Upgrade.DoubleAdders1, 5000, 'Double Adder effectiveness', 'Doubles the points given to adjacent incrementors.', '2', UpgradeEffect.DoubleAdders, Upgrade.UnlockAdder),
            new UpgradeInfo(Upgrade.DoubleVoidIncrementors1, 5000, 'Double Void Incrementor generation', 'Doubles the base points generated by Void Incrementors.', '2', UpgradeEffect.DoubleVoidIncrementors, Upgrade.UnlockVoidIncrementor),
        ].sort(function (x, y) { return x.cost - y.cost; });
        this.upgrades.forEach(function (x) {
            _this.upgradesDict[x.id] = x;
            x.init();
        });
    };
    Game.prototype.getBlockInfo = function (blockType) {
        return this.blocks.filter(function (x) { return x.type === blockType; })[0];
    };
    Game.prototype.getUpgradeInfo = function (upgrade) {
        return this.upgrades.filter(function (x) { return x.id === upgrade; })[0];
    };
    return Game;
}());
var MouseState = /** @class */ (function () {
    function MouseState(x, y, left, right) {
        this.x = x;
        this.y = y;
        this.left = left;
        this.right = right;
    }
    return MouseState;
}());
var Input = /** @class */ (function () {
    function Input(canvas) {
        var _this = this;
        this.previousMouseState = new MouseState(0, 0, false, false);
        this.currentMouseState = new MouseState(0, 0, false, false);
        this.runningMouseState = new MouseState(0, 0, false, false);
        canvas.addEventListener('mousedown', function (event) {
            if (event.button === MouseButton.Left)
                _this.runningMouseState.left = true;
            else if (event.button === MouseButton.Right)
                _this.runningMouseState.right = true;
        });
        canvas.addEventListener('mouseup', function (event) {
            if (event.button === MouseButton.Left)
                _this.runningMouseState.left = false;
            else if (event.button === MouseButton.Right)
                _this.runningMouseState.right = false;
        });
        canvas.addEventListener('mousemove', function (event) {
            var target = event.currentTarget;
            var rect = target.getBoundingClientRect();
            _this.runningMouseState.x = event.clientX - rect.left;
            _this.runningMouseState.y = event.clientY - rect.top;
        });
        canvas.addEventListener('contextmenu', function (event) { return event.preventDefault(); });
    }
    Input.prototype.update = function () {
        this.previousMouseState = this.currentMouseState;
        this.currentMouseState = new MouseState(this.runningMouseState.x, this.runningMouseState.y, this.runningMouseState.left, this.runningMouseState.right);
    };
    Input.prototype.getX = function () {
        return this.currentMouseState.x;
    };
    Input.prototype.getY = function () {
        return this.currentMouseState.y;
    };
    Input.prototype.isUp = function (mouseButton) {
        if (mouseButton === MouseButton.Left)
            return !this.currentMouseState.left;
        if (mouseButton === MouseButton.Right)
            return !this.currentMouseState.right;
        return false;
    };
    Input.prototype.isDown = function (mouseButton) {
        if (mouseButton === MouseButton.Left)
            return this.currentMouseState.left;
        if (mouseButton === MouseButton.Right)
            return this.currentMouseState.right;
        return false;
    };
    Input.prototype.isClicked = function (mouseButton) {
        if (mouseButton === MouseButton.Left)
            return this.currentMouseState.left && !this.previousMouseState.left;
        if (mouseButton === MouseButton.Right)
            return this.currentMouseState.right && !this.previousMouseState.right;
        return false;
    };
    Input.prototype.isReleased = function (mouseButton) {
        if (mouseButton === MouseButton.Left)
            return !this.currentMouseState.left && this.previousMouseState.left;
        if (mouseButton === MouseButton.Right)
            return !this.currentMouseState.right && this.previousMouseState.right;
        return false;
    };
    return Input;
}());
var Grid = /** @class */ (function () {
    function Grid() {
        this.width = 1;
        this.height = 1;
        this.offsetX = 10;
        this.offsetY = 10;
        this.padding = 5;
        this.size = 50;
        this.paddedSize = this.size - this.padding;
        this.paddedOffsetX = this.offsetX + this.padding;
        this.paddedOffsetY = this.offsetY + this.padding;
    }
    Grid.prototype.init = function () {
        this.grid = [];
        for (var x = 0; x < this.width; x++) {
            var arr = [];
            for (var y = 0; y < this.height; y++) {
                arr.push(BlockType.Empty);
            }
            this.grid.push(arr);
        }
    };
    Grid.prototype.update = function () {
        var input = game.input;
        var inputX = input.getX();
        var inputY = input.getY();
        if (input.isClicked(MouseButton.Left) && game.blockTray.canPurchase()) {
            for (var x = 0; x < this.width; x++) {
                for (var y = 0; y < this.height; y++) {
                    if (this.grid[x][y] === BlockType.Empty && pointWithinRectangle(inputX, inputY, this.paddedOffsetX + x * this.size, this.paddedOffsetY + y * this.size, this.paddedSize, this.paddedSize)) {
                        this.grid[x][y] = game.blockTray.purchase();
                        this.updatePointsPerTick();
                    }
                }
            }
        }
        if (input.isClicked(MouseButton.Right)) {
            for (var x = 0; x < this.width; x++) {
                for (var y = 0; y < this.height; y++) {
                    if (this.grid[x][y] !== BlockType.Empty && pointWithinRectangle(inputX, inputY, this.paddedOffsetX + x * this.size, this.paddedOffsetY + y * this.size, this.paddedSize, this.paddedSize)) {
                        this.grid[x][y] = BlockType.Empty;
                        this.updatePointsPerTick();
                    }
                }
            }
        }
    };
    Grid.prototype.draw = function (context) {
        context.strokeStyle = game.colours.boxNormal;
        context.fillStyle = game.colours.textNormal;
        context.font = game.fonts.large;
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                var rectX = this.paddedOffsetX + x * this.size;
                var rectY = this.paddedOffsetY + y * this.size;
                context.strokeRect(rectX, rectY, this.paddedSize, this.paddedSize);
                var cell = this.grid[x][y];
                if (cell !== BlockType.Empty) {
                    var block = game.blocksDict[cell];
                    context.fillText(block.char, rectX + 10, rectY + 35);
                }
            }
        }
    };
    Grid.prototype.adjustGridSize = function () {
        for (var x = 0; x < this.width; x++) {
            if (this.grid.length > x) {
                var arr = this.grid[x];
                for (var toAdd = this.height - arr.length; toAdd--; toAdd > 0) {
                    arr.push(BlockType.Empty);
                }
                this.grid[x] = arr;
            }
            else {
                var arr = [];
                for (var y = 0; y < this.height; y++) {
                    arr.push(BlockType.Empty);
                }
                this.grid.push(arr);
            }
        }
        this.updatePointsPerTick();
    };
    Grid.prototype.updatePointsPerTick = function () {
        var pointGrid = [];
        var adderGrid = [];
        var incrementorBlock = game.getBlockInfo(BlockType.Incrementor);
        var voidIncrementorBlock = game.getBlockInfo(BlockType.VoidIncrementor);
        for (var x = 0; x < this.width; x++) {
            var arr = [];
            for (var y = 0; y < this.height; y++) {
                var blockType = this.grid[x][y];
                if (blockType === BlockType.Incrementor)
                    arr.push(incrementorBlock.magnitude);
                else if (blockType === BlockType.VoidIncrementor)
                    arr.push(this.getVoidPoints(x, y, voidIncrementorBlock.magnitude));
                else
                    arr.push(0);
            }
            pointGrid.push(arr);
        }
        var adderBlock = game.getBlockInfo(BlockType.Adder);
        for (var x = 0; x < this.width; x++) {
            var arr = [];
            for (var y = 0; y < this.height; y++) {
                arr.push(this.grid[x][y] === BlockType.Adder ? adderBlock.magnitude : 0);
            }
            adderGrid.push(arr);
        }
        var doublerBlock = game.getBlockInfo(BlockType.Doubler);
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                if (this.grid[x][y] === BlockType.Doubler) {
                    this.tryDoubleCoord(x - 1, y, doublerBlock.magnitude, adderGrid);
                    this.tryDoubleCoord(x + 1, y, doublerBlock.magnitude, adderGrid);
                    this.tryDoubleCoord(x, y - 1, doublerBlock.magnitude, adderGrid);
                    this.tryDoubleCoord(x, y + 1, doublerBlock.magnitude, adderGrid);
                }
            }
        }
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                if (this.grid[x][y] === BlockType.Adder) {
                    this.tryIncrementCoord(x - 1, y, pointGrid, adderGrid[x][y]);
                    this.tryIncrementCoord(x + 1, y, pointGrid, adderGrid[x][y]);
                    this.tryIncrementCoord(x, y - 1, pointGrid, adderGrid[x][y]);
                    this.tryIncrementCoord(x, y + 1, pointGrid, adderGrid[x][y]);
                }
            }
        }
        var total = 0;
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                total += pointGrid[x][y];
            }
        }
        var edgeCaseBlock = game.getBlockInfo(BlockType.EdgeCase);
        var edgeMult = 1;
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                if (this.grid[x][y] === BlockType.EdgeCase) {
                    edgeMult *= Math.pow(edgeCaseBlock.magnitude, this.getEdgesTouched(x, y));
                }
            }
        }
        total *= edgeMult;
        game.points.pointsPerTick = total;
    };
    Grid.prototype.getBlockTypeOfCoord = function (x, y) {
        return x <= -1 || y <= -1 || x >= this.width || y >= this.height ? BlockType.Empty : this.grid[x][y];
    };
    Grid.prototype.tryIncrementCoord = function (x, y, grid, incrementAmount) {
        var blockType = this.getBlockTypeOfCoord(x, y);
        if (blockType === BlockType.Incrementor
            || blockType === BlockType.VoidIncrementor) {
            grid[x][y] += incrementAmount;
        }
    };
    Grid.prototype.tryDoubleCoord = function (x, y, magnitude, grid) {
        if (this.getBlockTypeOfCoord(x, y) === BlockType.Adder) {
            grid[x][y] *= magnitude;
        }
    };
    Grid.prototype.getEdgesTouched = function (x, y) {
        var edgesTouched = 0;
        if (x === 0)
            edgesTouched++;
        if (y === 0)
            edgesTouched++;
        if (x === this.width - 1)
            edgesTouched++;
        if (y === this.height - 1)
            edgesTouched++;
        return edgesTouched;
    };
    Grid.prototype.getVoidPoints = function (x, y, magnitude) {
        var points = 0;
        if (this.getBlockTypeOfCoord(x - 1, y) === BlockType.Empty)
            points += magnitude;
        if (this.getBlockTypeOfCoord(x + 1, y) === BlockType.Empty)
            points += magnitude;
        if (this.getBlockTypeOfCoord(x, y - 1) === BlockType.Empty)
            points += magnitude;
        if (this.getBlockTypeOfCoord(x, y + 1) === BlockType.Empty)
            points += magnitude;
        return points;
    };
    return Grid;
}());
var Points = /** @class */ (function () {
    function Points() {
        this.points = 10;
        this.pointsPerTick = 0;
        this.updateTime = 1000;
        this.currentTime = 0;
    }
    Points.prototype.update = function () {
        this.currentTime += game.updateInterval;
        if (this.currentTime >= this.updateTime) {
            this.currentTime -= this.updateTime;
            this.points += this.pointsPerTick;
        }
    };
    Points.prototype.draw = function (context) {
        context.font = game.fonts.large;
        context.fillStyle = game.colours.textNormal;
        context.fillText(this.points.toFixed(), 20, 550);
        context.fillText(this.pointsPerTick.toFixed(1) + '/s', 20, 580);
    };
    return Points;
}());
var BlockInfo = /** @class */ (function () {
    function BlockInfo(type, cost, name, char, description, magnitude, unlocked) {
        if (unlocked === void 0) { unlocked = false; }
        this.type = type;
        this.cost = cost;
        this.name = name;
        this.char = char;
        this.description = description;
        this.magnitude = magnitude;
        this.unlocked = unlocked;
    }
    return BlockInfo;
}());
var BlockTray = /** @class */ (function () {
    function BlockTray() {
        this.blocks = [];
        this.selected = -1;
        this.offsetX = 20;
        this.offsetY = 450;
    }
    BlockTray.prototype.update = function () {
        var input = game.input;
        var x = input.getX();
        var y = input.getY();
        var visibleBlocks = this.getVisibleBlocks();
        for (var i = 0; i < visibleBlocks.length; i++) {
            if (pointWithinRectangle(x, y, this.offsetX + (50 * i), this.offsetY, 45, 45)) {
                var block = visibleBlocks[i];
                if (input.isClicked(MouseButton.Left)) {
                    this.selected = this.selected === i ? -1 : i;
                }
                game.tooltip = new Tooltip(block.name, block.description, x, y, block.cost);
            }
        }
    };
    BlockTray.prototype.draw = function (context) {
        var visibleBlocks = this.getVisibleBlocks();
        for (var i = 0; i < visibleBlocks.length; i++) {
            var block = visibleBlocks[i];
            var selected = i === this.selected;
            var x = this.offsetX + (50 * i);
            context.strokeStyle = selected ? game.colours.boxGood : game.colours.boxNormal;
            context.strokeRect(x, this.offsetY, 45, 45);
            context.font = game.fonts.large;
            context.fillStyle = selected ? game.colours.textGood : game.colours.textNormal;
            context.fillText(block.char, x + 10, this.offsetY + 35);
        }
    };
    BlockTray.prototype.canPurchase = function () {
        return this.selected !== -1 && game.points.points >= this.getVisibleBlocks()[this.selected].cost;
    };
    BlockTray.prototype.purchase = function () {
        var block = this.getVisibleBlocks()[this.selected];
        game.points.points -= block.cost;
        return block.type;
    };
    BlockTray.prototype.getVisibleBlocks = function () {
        return game.blocks.filter(function (x) { return x.unlocked; });
    };
    return BlockTray;
}());
var UpgradeInfo = /** @class */ (function () {
    function UpgradeInfo(id, cost, name, description, char, effect, preId) {
        if (preId === void 0) { preId = null; }
        this.id = id;
        this.cost = cost;
        this.name = name;
        this.description = description;
        this.char = char;
        this.effect = effect;
        this.preId = preId;
        this.purchased = false;
        this.pre = null;
    }
    UpgradeInfo.prototype.init = function () {
        if (this.preId != null) {
            this.pre = game.getUpgradeInfo(this.preId);
        }
    };
    UpgradeInfo.prototype.isVisible = function () {
        return !this.purchased && (this.preId == null || game.getUpgradeInfo(this.preId).purchased == true);
    };
    UpgradeInfo.prototype.action = function () {
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
    };
    UpgradeInfo.prototype.purchase = function () {
        game.points.points -= this.cost;
        this.action();
        this.purchased = true;
    };
    return UpgradeInfo;
}());
var UpgradeTray = /** @class */ (function () {
    function UpgradeTray() {
        this.offsetX = 20;
        this.offsetY = 400;
    }
    UpgradeTray.prototype.update = function () {
        var input = game.input;
        var x = input.getX();
        var y = input.getY();
        var visibleUpgrades = this.getVisibleUpgrades();
        for (var i = 0; i < visibleUpgrades.length; i++) {
            if (pointWithinRectangle(x, y, this.offsetX + (50 * i), this.offsetY, 45, 45)) {
                var upgrade = visibleUpgrades[i];
                if (input.isClicked(MouseButton.Left) && upgrade.cost <= game.points.points) {
                    upgrade.purchase();
                }
                game.tooltip = new Tooltip(upgrade.name, upgrade.description, x, y, upgrade.cost);
            }
        }
    };
    UpgradeTray.prototype.draw = function (context) {
        var visibleUpgrades = this.getVisibleUpgrades();
        for (var i = 0; i < visibleUpgrades.length; i++) {
            var upgrade = visibleUpgrades[i];
            var x = this.offsetX + (50 * i);
            context.strokeStyle = game.colours.boxNormal;
            context.strokeRect(x, this.offsetY, 45, 45);
            context.font = game.fonts.large;
            context.fillStyle = game.colours.textNormal;
            context.fillText(upgrade.char, x + 10, this.offsetY + 35);
        }
    };
    UpgradeTray.prototype.getVisibleUpgrades = function () {
        return game.upgrades.filter(function (x) { return x.isVisible(); });
    };
    return UpgradeTray;
}());
var Tooltip = /** @class */ (function () {
    function Tooltip(title, text, x, y, cost) {
        if (cost === void 0) { cost = null; }
        this.title = title;
        this.text = text;
        this.x = x;
        this.y = y;
        this.cost = cost;
    }
    Tooltip.prototype.draw = function (context) {
        var height = this.getHeight();
        var top = this.getTop();
        var width = this.getWidth(context);
        context.fillStyle = game.colours.background;
        context.fillRect(this.x, top, width, height);
        context.strokeStyle = game.colours.boxNormal;
        context.strokeRect(this.x, top, width, height);
        context.fillStyle = game.colours.textNormal;
        context.font = game.fonts.large;
        context.fillText(this.title, this.x + 5, top + 30);
        context.font = game.fonts.medium;
        context.fillText(this.text, this.x + 5, top + 55);
        if (this.cost != null) {
            context.font = game.fonts.medium;
            context.fillText(this.getCostPrefix(), this.x + 5, top + 80);
            context.fillStyle = this.cost <= game.points.points ? game.colours.textGood : game.colours.textBad;
            context.fillText(this.cost.toString(), this.x + 5 + this.getCostPrefixWidth(context), top + 80);
        }
    };
    Tooltip.prototype.getHeight = function () {
        return this.cost == null ? 60 : 90;
    };
    Tooltip.prototype.getTop = function () {
        return this.y - this.getHeight();
    };
    Tooltip.prototype.getCostPrefix = function () {
        return 'Cost: ';
    };
    Tooltip.prototype.getCostPrefixWidth = function (context) {
        return context.measureText(this.getCostPrefix()).width;
    };
    Tooltip.prototype.getWidth = function (context) {
        context.font = game.fonts.large;
        var titleWidth = context.measureText(this.title).width;
        context.font = game.fonts.medium;
        var textWidth = context.measureText(this.text).width;
        if (this.cost == null) {
            return Math.max(titleWidth, textWidth) + 10;
        }
        context.font = game.fonts.medium;
        var costWidth = context.measureText(this.getCostPrefix() + this.cost.toString()).width;
        return Math.max(titleWidth, textWidth, costWidth) + 10;
    };
    return Tooltip;
}());
function pointWithinRectangle(px, py, rx, ry, rw, rh) {
    return px >= rx
        && px <= rx + rw
        && py >= ry
        && py <= ry + rh;
}
var BlockType;
(function (BlockType) {
    BlockType[BlockType["Empty"] = 0] = "Empty";
    BlockType[BlockType["Incrementor"] = 1] = "Incrementor";
    BlockType[BlockType["Adder"] = 2] = "Adder";
    BlockType[BlockType["Doubler"] = 3] = "Doubler";
    BlockType[BlockType["EdgeCase"] = 4] = "EdgeCase";
    BlockType[BlockType["VoidIncrementor"] = 5] = "VoidIncrementor";
})(BlockType || (BlockType = {}));
var Upgrade;
(function (Upgrade) {
    Upgrade[Upgrade["GridSize1"] = 1] = "GridSize1";
    Upgrade[Upgrade["GridSize2"] = 2] = "GridSize2";
    Upgrade[Upgrade["GridSize3"] = 3] = "GridSize3";
    Upgrade[Upgrade["GridSize4"] = 4] = "GridSize4";
    Upgrade[Upgrade["GridSize5"] = 5] = "GridSize5";
    Upgrade[Upgrade["GridSize6"] = 6] = "GridSize6";
    Upgrade[Upgrade["GridSize7"] = 7] = "GridSize7";
    Upgrade[Upgrade["GridSize8"] = 8] = "GridSize8";
    Upgrade[Upgrade["UnlockAdder"] = 101] = "UnlockAdder";
    Upgrade[Upgrade["UnlockDoubler"] = 102] = "UnlockDoubler";
    Upgrade[Upgrade["UnlockEdgeCase"] = 103] = "UnlockEdgeCase";
    Upgrade[Upgrade["UnlockVoidIncrementor"] = 104] = "UnlockVoidIncrementor";
    Upgrade[Upgrade["DoubleIncrementors1"] = 201] = "DoubleIncrementors1";
    Upgrade[Upgrade["DoubleAdders1"] = 301] = "DoubleAdders1";
    Upgrade[Upgrade["DoubleVoidIncrementors1"] = 401] = "DoubleVoidIncrementors1";
})(Upgrade || (Upgrade = {}));
var UpgradeEffect;
(function (UpgradeEffect) {
    UpgradeEffect[UpgradeEffect["BiggerGrid"] = 1] = "BiggerGrid";
    UpgradeEffect[UpgradeEffect["UnlockAdder"] = 101] = "UnlockAdder";
    UpgradeEffect[UpgradeEffect["UnlockDoubler"] = 102] = "UnlockDoubler";
    UpgradeEffect[UpgradeEffect["UnlockEdgeCase"] = 103] = "UnlockEdgeCase";
    UpgradeEffect[UpgradeEffect["UnlockVoidIncrementor"] = 104] = "UnlockVoidIncrementor";
    UpgradeEffect[UpgradeEffect["DoubleIncrementors"] = 201] = "DoubleIncrementors";
    UpgradeEffect[UpgradeEffect["DoubleAdders"] = 202] = "DoubleAdders";
    UpgradeEffect[UpgradeEffect["DoubleVoidIncrementors"] = 205] = "DoubleVoidIncrementors";
})(UpgradeEffect || (UpgradeEffect = {}));
var MouseButton;
(function (MouseButton) {
    MouseButton[MouseButton["Left"] = 0] = "Left";
    MouseButton[MouseButton["Middle"] = 1] = "Middle";
    MouseButton[MouseButton["Right"] = 2] = "Right";
    MouseButton[MouseButton["Back"] = 3] = "Back";
    MouseButton[MouseButton["Forward"] = 4] = "Forward";
})(MouseButton || (MouseButton = {}));
window.onload = main;
//# sourceMappingURL=main.js.map