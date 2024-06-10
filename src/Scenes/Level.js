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
        this.GOALX = this.tileXtoWorld(46);
        this.GOALY = this.tileYtoWorld(17.5);

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

        //give path layers a certain property for enemy pathing
        let defenseGrid = this.layersToGrid([this.groundLayer, this.decorationLayer]);
        console.log(defenseGrid);

        //create finder for pathfinding
        this.finder = new EasyStar.js();

        this.finder.setGrid(defenseGrid);

        let walkables = [25];
        this.placeableTiles = this.getPlaceables();

        // Tell EasyStar which tiles can be walked on
        this.finder.setAcceptableTiles(walkables);

        //debug
        // Loop through the grid to highlight walkable tiles
        defenseGrid.forEach((row, y) => {
            row.forEach((tile, x) => {
            if (walkables.includes(tile)) {
            // Assuming you have a method to highlight a tile, e.g., `highlightTile(x, y)`

            }
        });
        });

        ////create camera
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setZoom(this.SCALE);


        //create donut goal
        my.sprite.donutGoal = this.add.sprite(this.GOALX, this.GOALY, "donut").setOrigin(0,0).setScale(1.5);

        //temp test turret here
        my.sprite.turret = new Turret(this, this.tileXtoWorld(5), this.tileYtoWorld(19), 150);

        //group to hold enemies
        my.enemies = this.add.group();
        //temp test enemy here
        //later make waves
        my.sprite.enemyFirst = new Enemy(this, this.tileXtoWorld(2), this.tileYtoWorld(24), 1, this.finder);
        my.sprite.enemyFirst.findPath();
        my.enemies.add(my.sprite.enemyFirst);


        //move to turret creation function after that is implemented
        this.physics.add.overlap(my.sprite.turret.projectiles, my.enemies, (enemy, projectile) => { //why are u like this phaser i hate you
            console.log("collision detected");
            projectile.y = 5000;
            enemy.takeDamage();
        });

        this.placingMode = false;
        this.highlights = [];

        this.gridGraphics; 

        this.input.keyboard.on('keydown-P', () => {
            this.togglePlacingMode();
        }, this);

    }


    //helper functions

    //debug function to highlight specified tiles
    highlightTile(x, y)
    {
        // Create a simple rectangle or any visual indicator on the map
        let rect = this.add.rectangle(x * this.TILESIZE, y * this.TILESIZE, this.TILESIZE, this.TILESIZE, 0xacffca, 0.5);
        rect.setOrigin(0);
        this.highlights.push(rect);
    }

    notThisTile(x, y)
    {
        let rect = this.add.rectangle(x * this.TILESIZE, y * this.TILESIZE, this.TILESIZE, this.TILESIZE, 0xea9999, 0.5);
        rect.setOrigin(0);
        this.highlights.push(rect);

    }

    //alternate grid that holds spaces where turrets can be placed
    getPlaceables()
    {
        let placeableTiles = [];

        for (let y = 0; y < this.map.height; y++) {
            placeableTiles[y] = [];
            for (let x = 0; x < this.map.width; x++) {
                const tile = this.map.getTileAt(x, y, true, 'Ground-n-Paths');
                const overlap = this.map.getTileAt(x, y, 'Decoration');
                if (tile.properties.tp && !overlap.properties.here)
                {
                    placeableTiles[y][x] = true;
                }
                else
                {
                    placeableTiles[y][x] = false;

                }
            }
        }
        return placeableTiles;

    }

    drawGrid()
    {
        console.log('HELLOOOOOOO????');
        let graphics = this.add.graphics();
        graphics.lineStyle(1, 0xffffff, 0.5);  //set the line style (color and alpha)

        // Vertical lines
        for (let x = 0; x <= this.map.widthInPixels; x += this.TILESIZE) 
        {
            graphics.lineBetween(x, 0, x, this.map.heightInPixels);
        }

        // Horizontal lines
        for (let y = 0; y <= this.map.heightInPixels; y += this.TILESIZE) {
            graphics.lineBetween(0, y, this.map.widthInPixels, y);
            
        }

        graphics.strokePath();
        return graphics;
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

    togglePlacingMode()
    {
        if (this.placingMode == true)
        {
            this.disablePlacingMode();
        }
        else 
        {
            this.enablePlacingMode();

        }

    }
    
    //turn on grid and highlights. maybe also change ui to show relevant information
    enablePlacingMode()
    {
        console.log("enabling pm");

        this.gridGraphics = this.drawGrid();

        this.placingMode = true;
        for (let y = 0; y < this.placeableTiles.length; y++) {
            for (let x = 0; x < this.placeableTiles[y].length; x++) {
                if (this.placeableTiles[y][x]) {
                    this.highlightTile(x, y);
                } else {
                    this.notThisTile(x, y);
                }
            }
        }

    }

    //turn off grid and highlights
    disablePlacingMode()
    {
        console.log("disabling pm");
        this.placingMode = false;
        this.highlights.forEach(highlight => highlight.destroy());
        this.highlights = [];
        this.gridGraphics.clear();

    }

    tileXtoWorld(tileX) {
        return tileX * this.TILESIZE;
    }

    tileYtoWorld(tileY) {
        return tileY * this.TILESIZE;
    }

    update()
    {
        my.sprite.turret.update();

    }

}