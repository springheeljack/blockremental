var game;
function main() {
    game = new Game();
    game.init();
    game.startUpdating();
    game.startDrawing();
}
var Game = /** @class */ (function () {
    function Game() {
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
        this.input = new Input(this.canvas);
        this.points = new Points();
        this.grid = new Grid();
        this.grid.init();
        this.blockTray = new BlockTray();
        this.blockTray.init();
        this.upgradeTray = new UpgradeTray();
        this.upgradeTray.init();
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
                    context.fillText(cell.toString(), rectX + 10, rectY + 35);
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
    };
    Grid.prototype.updatePointsPerTick = function () {
        var pointGrid = [];
        var adderGrid = [];
        for (var x = 0; x < this.width; x++) {
            var arr = [];
            for (var y = 0; y < this.height; y++) {
                arr.push(this.grid[x][y] === BlockType.Incrementor ? 1 : 0);
            }
            pointGrid.push(arr);
        }
        for (var x = 0; x < this.width; x++) {
            var arr = [];
            for (var y = 0; y < this.height; y++) {
                arr.push(this.grid[x][y] === BlockType.Adder ? 1 : 0);
            }
            adderGrid.push(arr);
        }
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                if (this.grid[x][y] === BlockType.Doubler) {
                    this.tryDoubleCoord(x - 1, y, adderGrid);
                    this.tryDoubleCoord(x + 1, y, adderGrid);
                    this.tryDoubleCoord(x, y - 1, adderGrid);
                    this.tryDoubleCoord(x, y + 1, adderGrid);
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
        var edgeMult = 1;
        for (var x = 0; x < this.width; x++) {
            for (var y = 0; y < this.height; y++) {
                if (this.grid[x][y] === BlockType.EdgeCase) {
                    edgeMult *= this.getEdgeMultiplier(x, y);
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
        if (this.getBlockTypeOfCoord(x, y) === BlockType.Incrementor) {
            grid[x][y] += incrementAmount;
        }
    };
    Grid.prototype.tryDoubleCoord = function (x, y, grid) {
        if (this.getBlockTypeOfCoord(x, y) === BlockType.Adder) {
            grid[x][y] *= 2;
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
    Grid.prototype.getEdgeMultiplier = function (x, y) {
        return Math.pow(1.05, this.getEdgesTouched(x, y));
    };
    return Grid;
}());
var Points = /** @class */ (function () {
    function Points() {
        this.points = 1000;
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
        context.fillText('+' + this.pointsPerTick.toFixed(1) + '/s', 20, 580);
    };
    return Points;
}());
var BlockInfo = /** @class */ (function () {
    function BlockInfo(cost, type, name, char, description) {
        this.cost = cost;
        this.type = type;
        this.name = name;
        this.char = char;
        this.description = description;
    }
    BlockInfo.prototype.draw = function (context, x, y, selected) {
        context.strokeStyle = selected ? game.colours.boxGood : game.colours.boxNormal;
        context.strokeRect(x, y, 45, 45);
        context.font = game.fonts.large;
        context.fillStyle = selected ? game.colours.textGood : game.colours.textNormal;
        context.fillText(this.char, x + 10, y + 35);
    };
    return BlockInfo;
}());
var BlockTray = /** @class */ (function () {
    function BlockTray() {
        this.blocks = [];
        this.selected = -1;
        this.offsetX = 20;
        this.offsetY = 450;
    }
    BlockTray.prototype.init = function () {
        this.blocks = [
            new BlockInfo(10, BlockType.Incrementor, 'Incrementor', 'I', 'Collects 1 point per second.'),
            new BlockInfo(20, BlockType.Adder, 'Adder', 'A', 'Increases the points collected by adjacent Incrementors by 1.'),
            new BlockInfo(30, BlockType.Doubler, 'Doubler', 'D', 'Doubles the effectiveness of adjacent Adders.'),
            new BlockInfo(40, BlockType.EdgeCase, 'Edge Case', 'E', 'Increases points per second by 5%.'),
        ];
    };
    BlockTray.prototype.update = function () {
        var input = game.input;
        var x = input.getX();
        var y = input.getY();
        for (var i = 0; i < this.blocks.length; i++) {
            if (pointWithinRectangle(x, y, this.offsetX + (50 * i), this.offsetY, 45, 45)) {
                var block = this.blocks[i];
                if (input.isClicked(MouseButton.Left)) {
                    this.selected = this.selected === i ? -1 : i;
                }
                game.tooltip = new Tooltip(block.name, block.description, x, y, block.cost);
            }
        }
    };
    BlockTray.prototype.draw = function (context) {
        for (var i = 0; i < this.blocks.length; i++) {
            this.blocks[i].draw(context, this.offsetX + (50 * i), this.offsetY, i === this.selected);
        }
    };
    BlockTray.prototype.canPurchase = function () {
        return this.selected !== -1 && game.points.points >= this.blocks[this.selected].cost;
    };
    BlockTray.prototype.purchase = function () {
        var block = this.blocks[this.selected];
        game.points.points -= block.cost;
        return block.type;
    };
    return BlockTray;
}());
var UpgradeInfo = /** @class */ (function () {
    function UpgradeInfo(cost, name, description, char, action) {
        this.cost = cost;
        this.name = name;
        this.description = description;
        this.char = char;
        this.action = action;
    }
    UpgradeInfo.prototype.draw = function (context, x, y) {
        context.strokeStyle = game.colours.boxNormal;
        context.strokeRect(x, y, 45, 45);
        context.font = game.fonts.large;
        context.fillStyle = game.colours.textNormal;
        context.fillText(this.char, x + 10, y + 35);
    };
    return UpgradeInfo;
}());
var UpgradeTray = /** @class */ (function () {
    function UpgradeTray() {
        this.upgrades = [];
        this.offsetX = 20;
        this.offsetY = 400;
    }
    UpgradeTray.prototype.init = function () {
        this.upgrades = [
            new UpgradeInfo(15, 'Bigger grid', 'Increases the size of the grid by 1.', '+', function () {
                game.grid.width += 1;
                game.grid.height += 1;
                game.grid.adjustGridSize();
            })
        ];
    };
    UpgradeTray.prototype.update = function () {
        var input = game.input;
        var x = input.getX();
        var y = input.getY();
        for (var i = 0; i < this.upgrades.length; i++) {
            if (pointWithinRectangle(x, y, this.offsetX + (50 * i), this.offsetY, 45, 45)) {
                var upgrade = this.upgrades[i];
                if (input.isClicked(MouseButton.Left) && upgrade.cost <= game.points.points) {
                    game.points.points -= upgrade.cost;
                    upgrade.action();
                }
                game.tooltip = new Tooltip(upgrade.name, upgrade.description, x, y, upgrade.cost);
            }
        }
    };
    UpgradeTray.prototype.draw = function (context) {
        for (var i = 0; i < this.upgrades.length; i++) {
            this.upgrades[i].draw(context, this.offsetX + (50 * i), this.offsetY);
        }
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
})(BlockType || (BlockType = {}));
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