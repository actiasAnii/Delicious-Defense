//main gameplay scene
class Level extends Phaser.Scene {
    constructor() 
    {
        super("mainLevel");
    }

    init()
    {
        this.SCALE = 2.1;
        this.TILESIZE = 16;

    }

    preload()
    {

    }

    create()
    {
        /////////set up map
        this.map = this.add.tilemap("level", 16, 16, 48, 25);

        //add tilesets to map
        //first parameter: name we gave the tileset in Tiled
        //second parameter: key for the tilesheet
        this.town_tileset = this.map.addTilesetImage("tilemap-town_packed", "town_tiles");
        this.battle_tileset = this.map.addTilesetImage("tilemap-battle_packed", "battle_tiles");

        //create layers
        this.groundLayer = this.map.createLayer("Ground-n-Paths", [this.town_tileset, this.battle_tileset], 0, 0);
        this.decorationLayer = this.map.createLayer("Decoration", [this.town_tileset, this.battle_tileset], 0, 0);

        console.log('Ground Layer:', this.groundLayer);
        console.log('Decoration Layer:', this.decorationLayer);

        //give path layers a certain property for enemy pathing
        let defenseGrid = this.layersToGrid([this.groundLayer, this.decorationLayer]);
        console.log(defenseGrid);

        //create finder for pathfinding
        this.finder = new EasyStar.js();

        this.finder.setGrid(defenseGrid);

        let walkables = [12, 13, 14, 24, 25, 26, 36, 37, 38];

        // Tell EasyStar which tiles can be walked on
        this.finder.setAcceptableTiles(walkables);

        //debug
        // Loop through the grid to highlight walkable tiles
        defenseGrid.forEach((row, y) => {
            row.forEach((tile, x) => {
            if (walkables.includes(tile)) {
            // Assuming you have a method to highlight a tile, e.g., `highlightTile(x, y)`
            this.highlightTile(x, y); // Implement this method to visually highlight the tile
            }
        });
        });

        ////create camera
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setZoom(this.SCALE);


        //create donut goal
        my.sprite.donutGoal = this.add.sprite(this.tileXtoWorld(46), this.tileYtoWorld(17), "donut").setOrigin(0,0).setScale(1.5);


        //temp test enemy here
        my.sprite.enemy = this.add.sprite(this.tileXtoWorld(2), this.tileYtoWorld(24), "platformer_characters", "tile_0021.png").setOrigin(0,0).setScale(0.6);
        my.sprite.enemy.flipX = true;
        console.log(my.sprite.enemy.x, my.sprite.enemy.y);
        this.findPath(my.sprite.enemy.x, my.sprite.enemy.y);


    }


    //helper functions

    //debug function to highlight walkable tiles
    highlightTile(x, y) {
        // Create a simple rectangle or any visual indicator on the map
        let rect = this.add.rectangle(x * this.TILESIZE, y * this.TILESIZE, this.TILESIZE, this.TILESIZE, 0x00ff00, 0.5);
        rect.setOrigin(0);
        }

    // layersToGrid
    //
    // Uses the tile layer information in this.map and outputs
    // an array which contains the tile ids of the visible tiles on screen.
    // This array can then be given to Easystar for use in path finding.
    layersToGrid(arrayOfLayers) {
        let grid = [];
        // Initialize grid as two-dimensional array
        for (let y = 0; y < this.map.height; y++) 
            {
                grid[y] = [];
                for (let x = 0; x < this.map.width; x++) {
                grid[y][x] = 0; // Initialize all tiles to 0 (or any other default value)
                }
            }

        // Loop over layers to find tile IDs, store in grid

        arrayOfLayers.forEach(layer => {
            for (let y = 0; y < this.map.height; y++) {
                for (let x = 0; x < this.map.width; x++) {
                    let tile = layer.getTileAt(x, y);
                    if (tile !== null) {
                    grid[y][x] = tile.index-1; //was having an off by one error for some reson
                    }
                }
            }
        });

        return grid;
    }

    tileXtoWorld(tileX) {
        return tileX * this.TILESIZE;
    }

    tileYtoWorld(tileY) {
        return tileY * this.TILESIZE;
    }

    findPath(enemyX, enemyY) {
        // Convert enemy position from pixels to grid coordinates
        let fromX = Math.floor(enemyX / this.TILESIZE);
        let fromY = Math.floor(enemyY / this.TILESIZE);
    
        // Convert goal position from pixels to grid coordinates
        let toX = Math.floor(my.sprite.donutGoal.x / this.TILESIZE);
        let toY = Math.floor(my.sprite.donutGoal.y / this.TILESIZE);
    
        console.log('Going from (' + fromX + ',' + fromY + ') to (' + toX + ',' + toY + ')');
    
        this.finder.findPath(fromX, fromY, toX, toY, (path) => {
            if (path === null) {
                console.warn("Path was not found.");
            } else {
                console.log(path);
    
                // Convert path back to pixel coordinates
                let pixelPath = path.map(step => ({
                    x: step.x * this.TILESIZE,
                    y: step.y * this.TILESIZE
                }));
    
                this.moveCharacter(pixelPath, my.sprite.enemy);
            }
        });
    
        this.finder.calculate(); // Ask EasyStar to compute the path
    }

    moveCharacter(path, character) {
        if (path.length === 0) return;
    
        let tweens = [];
    
        for (let i = 0; i < path.length - 1; i++) {
            let ex = path[i + 1].x;
            let ey = path[i + 1].y;
            tweens.push({
                targets: character,
                x: ex,
                y: ey,
                duration: 200,
                ease: 'Linear'
            });
        }
    
        this.tweens.chain({
            targets: character,
            tweens: tweens
        });
    }

    update()
    {

    }

}