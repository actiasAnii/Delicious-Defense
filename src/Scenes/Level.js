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
        this.GOALX = this.tiletoWorld(54);
        this.GOALY = this.tiletoWorld(18.5);

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
        my.sprite.donutGoal = this.add.sprite(this.GOALX, this.GOALY, "donut").setOrigin(0.5).setScale(1.5);
        //cute lil player stand it by the donut. like commander of the troops
        my.sprite.playerStandIn = this.add.sprite(this.tiletoWorld(54), this.tiletoWorld(20), "platformer_characters", "tile_0006.png").setScale(0.8);
        my.sprite.playerStandIn.anims.play("friskHop");

        //group to hold enemies and turrets
        my.turrets = this.add.group({ 
            classType: Turret, 
            runChildUpdate: true
        });
        my.enemies = this.add.group();

        //temp test enemy here
        //later make waves
        my.sprite.enemyFirst = new Enemy(this, this.tiletoWorld(10), this.tiletoWorld(24), 1, this.finder);
        my.sprite.enemyFirst.findPath();

        my.enemies.add(my.sprite.enemyFirst);

        ////placing mode elements
        this.placingMode = false;
        this.highlights = [];
        this.gridGraphics; 

        this.input.keyboard.on('keydown-P', () => {
            this.togglePlacingMode();
        }, this);

        this.input.on('pointerdown', this.placeTurret, this);
        this.turretSelected = 1;

        this.createPopUp();

        my.text.placementInstructions = this.add.bitmapText(this.tiletoWorld(28), this.tiletoWorld(25.5), "thick", "click a green tile to place a new turret or click an existing turret with 4 selected to upgrade!!").
        setOrigin(0.5).setScale(0.8).setDepth(1000);
        my.text.placementInstructions.setVisible(false);

        //invalid placement and not enough resources pop ups

        //placing mode modes
        this.input.keyboard.on('keydown-ONE', () => {
            this.setMode(1);
        }, this);

        this.input.keyboard.on('keydown-TWO', () => {
            this.setMode(2);
        }, this);

        this.input.keyboard.on('keydown-THREE', () => {
            this.setMode(3);
        }, this);

        this.input.keyboard.on('keydown-FOUR', () => {
            this.setMode(4);
        }, this);


        //debug listener
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);
        this.physics.world.drawDebug = true;

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

    //draw grid on top of the map
    drawGrid()
    {
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

    //create a new turret
    placeTurret(pointer) {
        let conversion = this.TILESIZE * this.SCALE;
        let i = Math.floor(pointer.y / conversion);
        let j = Math.floor(pointer.x / conversion);
        console.log(i);
        console.log(j);
    
        //check if the tile is placeable
        if (this.placeableTiles[i][j] && this.placingMode == true && this.turretSelected != 4) 
        {
            console.log("placing turret of type: " + this.turretSelected);
            let turret = new Turret(this, j * this.TILESIZE + this.TILESIZE/2, i * this.TILESIZE + this.TILESIZE/2, this.turretSelected);
            my.turrets.add(turret);

            //make upgradeable
            // Make the turret interactive
            turret.setInteractive();

            // Add event listener for pointer over (hover) events
            turret.on('pointerover', function(pointer) {
                turret.highlightTurret();
                console.log("hovering");
            });

            //event listener for pointer out events
            turret.on('pointerout', function(pointer) {
                turret.normalizeTurret();
                console.log("no longer hovering");
            });

            //event listener for pointer down (click) events
            turret.on('pointerdown', function(pointer) {
                console.log('Turret clicked!');
                turret.upgrade();
            });

            //handle collision between this turret and an enemy
            this.physics.add.overlap(turret.projectiles, my.enemies, (enemy, projectile) => { //why are u like this phaser i hate you
                projectile.y = 5000;
                enemy.takeDamage(projectile);
            });
    
            //mark the tile as non-placeable
            this.placeableTiles[i][j] = false;
            //potentially mark more as nonplaceable
    
            //reset placing mode to update it
            if (this.placingMode) {
                this.togglePlacingMode();
                this.togglePlacingMode();
            }
        }
    }

    //toggle placing mode correctly based on if placing mode is true
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

        my.text.placementInstructions.setVisible(true);

        this.popUpContainer.setVisible(true);

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
        this.popUpContainer.setVisible(false);
        my.text.placementInstructions.setVisible(false);

    }

    tiletoWorld(tile) 
    {
        return tile * this.TILESIZE;
    }

    setMode(mode)
    {
        this.turretSelected = mode;
        this.currentText.setText("current selection: " + this.turretSelected);

    }


    //pop up turret creation menu
    createPopUp() {
        //use container to make handling easier :3
        this.popUpContainer = this.add.container(0,0);
        //graphics object for the background
        this.popUpBackground = this.add.graphics();
        this.popUpBackground.fillStyle(0xfab49b, 0.9);
        this.popUpBackground.fillRoundedRect(0, 0, this.tiletoWorld(10), this.tiletoWorld(12), 10); // Adjust size and position as needed
        this.popUpContainer.add(this.popUpBackground);

        //explanation text
        this.explanationText = this.add.bitmapText(this.tiletoWorld(5), this.tiletoWorld(1), "thick", " press num key to select\ntype of turret to create").setOrigin(0.5).setScale(0.75);
        this.popUpContainer.add(this.explanationText);

        ////descriptions of each turret type 
        //chara
        this.charaKey = this.add.sprite(this.tiletoWorld(1.5), this.tiletoWorld(2.5), "platformer_characters", "tile_0000.png").setScale(0.85);
        this.charaTitle = this.add.bitmapText(this.tiletoWorld(3), this.tiletoWorld(1.75), "thick", "1 - CHARA <cost: 60>").setOrigin(0).setScale(0.7);
        this.charaDesc = this.add.bitmapText(this.tiletoWorld(3), this.tiletoWorld(2.25), "thick", "base speed: medium\nbase range: medium\nbase damage: 1").setOrigin(0).setScale(0.6);
        this.popUpContainer.add(this.charaDesc); this.popUpContainer.add(this.charaTitle); this.popUpContainer.add(this.charaKey);

        //enif 
        this.enifKey = this.add.sprite(this.tiletoWorld(1.5), this.tiletoWorld(5), "platformer_characters", "tile_0004.png").setScale(0.85);
        this.enifTitle = this.add.bitmapText(this.tiletoWorld(3), this.tiletoWorld(4.25), "thick", "2 - ENIF <cost: 80>").setOrigin(0).setScale(0.7);
        this.enifDesc = this.add.bitmapText(this.tiletoWorld(3), this.tiletoWorld(4.75), "thick", "base speed: fast\nbase range: large\nbase damage: 1").setOrigin(0).setScale(0.6);
        this.popUpContainer.add(this.enifDesc); this.popUpContainer.add(this.enifTitle); this.popUpContainer.add(this.enifKey);

        //rigel
        this.rigelKey = this.add.sprite(this.tiletoWorld(1.5), this.tiletoWorld(7.5), "platformer_characters", "tile_0002.png").setScale(0.85);
        this.rigelTitle = this.add.bitmapText(this.tiletoWorld(3), this.tiletoWorld(6.75), "thick", "3 - RIGEL <cost 70>").setOrigin(0).setScale(0.7);
        this.rigelDesc = this.add.bitmapText(this.tiletoWorld(3), this.tiletoWorld(7.25), "thick", "base speed: slow\nbase range: small\nbase damage: 2").setOrigin(0).setScale(0.6);
        this.popUpContainer.add(this.rigelDesc); this.popUpContainer.add(this.rigelTitle); this.popUpContainer.add(this.rigelKey);

        //orr
        this.upgradeKey = this.add.sprite(this.tiletoWorld(1.5), this.tiletoWorld(9.75), "sparkle").setScale(0.85);
        this.upgradeTitle = this.add.bitmapText(this.tiletoWorld(3), this.tiletoWorld(9.25), "thick", "4 - UPGRADE").setOrigin(0).setScale(0.7);
        this.upgradeText = this.add.bitmapText(this.tiletoWorld(3), this.tiletoWorld(9.75), "thick", "spend 50\nupgrade existing turret").setOrigin(0).setScale(0.6);
        this.popUpContainer.add(this.upgradeText); this.popUpContainer.add(this.upgradeTitle); this.popUpContainer.add(this.upgradeKey);
        

        //curent selection
        this.currentText = this.add.bitmapText(this.tiletoWorld(5), this.tiletoWorld(11.25), "thick", " current selection: " + this.turretSelected).setOrigin(0.5).setScale(0.75);
        this.popUpContainer.add(this.currentText);

        //close instructions
        /*this.closeText = this.add.bitmapText(this.tiletoWorld(5), this.tiletoWorld(11.6), "thick", "press x to close this menu").setOrigin(0.5).setScale(0.5);
        this.popUpContainer.add(this.closeText);*/

        //set position and depth
        this.popUpContainer.setPosition(16, 16).setDepth(10000);
        //initially hide the pop-up
        this.popUpContainer.setVisible(false);
    }

    update()
    {

    }

}