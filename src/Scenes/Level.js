//main gameplay scene
class Level extends Phaser.Scene {
    constructor() 
    {
        super("mainLevel");
    }

    init()
    {
        /////set up initial variables

        this.TILESIZE = 16; //map tilesize
        //evil positioning
        this.GOALX = this.tiletoWorld(53.5);
        this.GOALY = this.tiletoWorld(18.5);

        //health bar elements
        my.sprite.fullHearts = [];
        my.sprite.emptyHearts = [];
        this.health = 4;

        //point related
        this.costs = [0, 75, 120, 90, 50]; //use to set costs and check if points are sufficient
        this.points = 180; //current points player has. start with a healthy amount

        //playing mode elements
        this.placingMode = false; //whether placing mode is active
        this.highlights = []; //array to hold highlights
        this.gridGraphics; //grid

        this.turretSelected = 1; //which turret type will be placed when player clicks

        //wave elements
        this.currWave = 0;
        this.waveActive = false;
        //wave configuration
        //format: [opportunities, spirits, sojourners, curiosities, perserverances]
        this.wave1 = [2, 0, 3, 2, 0];
        this.wave2 = [4, 6, 5, 2, 0];
        this.wave3 = [6, 8, 7, 7, 5];
        this.wave4 = [10, 10, 8, 8, 7]; 
        this.waves = [this.wave1, this.wave2, this.wave3, this.wave4];

        //a game end function should only occur once
        this.gameEnd = false;

    }

    preload()
    {

    }

    create()
    {
        /////////set up map
        this.map = this.add.tilemap("level", 16, 16, 55, 26);

        //add tilesets to map
        this.town_tileset = this.map.addTilesetImage("tilemap-town_packed", "town_tiles");

        //create layers
        this.groundLayer = this.map.createLayer("Ground-n-Paths", [this.town_tileset], 0, 0).setDepth(-100);
        this.decorationLayer = this.map.createLayer("Decoration", [this.town_tileset], 0, 0).setDepth(-100);

        //give path layers a certain property for enemy pathing
        let defenseGrid = this.layersToGrid([this.groundLayer, this.decorationLayer]);

        //create finder for pathfinding
        this.finder = new EasyStar.js();
        this.finder.setGrid(defenseGrid);

        //define walkables and placeables
        let walkables = [25];
        this.placeableTiles = this.getPlaceables();

        //tell EasyStar which tiles can be walked on
        this.finder.setAcceptableTiles(walkables);

        //create camera
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setZoom(SCALE);

        ///////sprite elements

        //create donut goal
        my.sprite.donutGoal = this.add.sprite(this.GOALX, this.GOALY, "donut").setOrigin(0.5).setScale(1.5).setDepth(2);

        //cute lil player stand in by the donut. like commander of the troops
        my.sprite.playerStandIn = this.add.sprite(this.GOALX, this.tiletoWorld(20), "platformer_characters", "tile_0006.png").setScale(0.8);
        my.sprite.playerStandIn.anims.play("friskHop");

        //group to hold turrets
        my.turrets = this.add.group({ 
            classType: Turret, 
            runChildUpdate: true //make sure to call each one's update
        });
        //group to hold enemy type groups
        my.enemies = this.add.group();
        //create enemy type groups and fill groups with enemies
        my.perseverances = this.createEnemies(4, 10);
        my.opportunities = this.createEnemies(0, 10);
        my.sojourners = this.createEnemies(2, 10);
        my.spirits = this.createEnemies(1, 10);
        my.curiosities = this.createEnemies(3, 10);
        //add to the consolidated enemy group
        my.enemies.addMultiple([my.opportunities, my.spirits, my.sojourners, my.curiosities, my.perseverances]);


        ///////general UI
        //create the point display
        my.text.pointTracker = this.add.bitmapText(this.tiletoWorld(4.75), this.tiletoWorld(0.4), "thick", ":" + ("00000" + this.points)
        .slice(-5)).setDepth(100000).setScale(1.2);
        my.sprite.coin = this.add.sprite(this.tiletoWorld(4), 10.5, "coin_1").setDepth(100000);
        my.sprite.coin.anims.play("coinFlip");

        //instructions for entering place mode
        my.text.pmEnterInstructions = this.add.bitmapText(this.tiletoWorld(28), this.tiletoWorld(25.5), "thick", "press P to enter placement mode!!").
        setOrigin(0.5).setScale(0.9).setDepth(1000);
        my.text.pmEnterInstructions.setVisible(true);

        //indicator of what player is defending
        my.text.defendTheDonut = this.add.bitmapText(this.GOALX, this.GOALY - 18, "thick", "DEFEND").
        setOrigin(0.5).setScale(0.7).setDepth(1000);
        //cute defend bob up and down animation
        this.tweens.add({
            targets: my.text.defendTheDonut,
            y: this.GOALY - 20, // target y position
            duration: 700,     // duration of the tween in milliseconds
            ease: 'Sine.easeInOut',
            yoyo: true,         // makes the tween reverse on complete
            repeat: -1          // repeat indefinitely
        });

        //display current wave
        my.text.currentWaveDisplay = this.add.bitmapText(this.tiletoWorld(29.1), this.tiletoWorld(0.8), "thick", "WAVE:" + this.currWave).
        setOrigin(0.5).setScale(1.2).setDepth(1000);

        //create health bar
        for (let i = 0; i < 4; i++) {
            //new sprite for both empty and full arrays
            let fullHeart = this.add.sprite(0, 20, 'heart_full').setOrigin(0).setScale(0.9);
            let emptyHeart = this.add.sprite(0, 20, 'heart_empty').setOrigin(0).setScale(0.9);

            fullHeart.visible = true; //start with full hearts visible
            emptyHeart.visible = false;

            //push sprites to corresponding arrays
            my.sprite.fullHearts.push(fullHeart);
            my.sprite.emptyHearts.push(emptyHeart);

            //position the hearts horizontally
            const offsetX = i * (fullHeart.displayWidth + 1) + 62; //setting x val here
            fullHeart.x = offsetX;
            emptyHeart.x = offsetX;
        }

        ///////placing mode UI/elements
        //toggle placing mode on P press
        this.input.keyboard.on('keydown-P', () => {
            this.togglePlacingMode();
        }, this);

        //handle clicks
        this.input.on('pointerdown', this.placeTurret, this);

        //turret options menu
        this.menuPopUp();

        //instructions for how placement works
        my.text.placementInstructions = this.add.bitmapText(this.tiletoWorld(28), this.tiletoWorld(25.5), "thick", "click a green tile to place a new turret or click an existing turret with 4 selected to upgrade!!").
        setOrigin(0.5).setScale(0.8).setDepth(1000);
        my.text.placementInstructions.setVisible(false);

        //placing mode selections
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
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true;
            this.physics.world.debugGraphic.clear();
        }, this);
        this.physics.world.drawDebug = false;

        //debug scene switch
        /*
        this.input.keyboard.on('keydown-W', () => {
            this.scene.start("endWin")
        }, this);

        this.input.keyboard.on('keydown-L', () => {
            this.scene.start("endLose")
        }, this);
        */


    }


    //////////////helper functions

    //make enemies
    createEnemies(type, count) //pass type and amount of enemies to create
    {
        //make group to hold enemies
        let tempGroup = this.add.group({ 
            classType: Enemy, 
            runChildUpdate: true //make sure to run each ones update function
        });

        //until count amount has been created
        for (let i = 0; i < count; i++)
        {
            let enemy = new Enemy(this, this.tiletoWorld(9), this.tiletoWorld(25), type, this.finder); //create new enemy
            tempGroup.add(enemy); //add to group
        }

        //return the group full of enemies
        return tempGroup;
    }

    //create a new turret
    placeTurret(pointer) 
    {
        //get the tile that has been clicked on
        let conversion = this.TILESIZE * SCALE;
        let i = Math.floor(pointer.y / conversion);
        let j = Math.floor(pointer.x / conversion);
    
        //check if the tile is placeable, if placing mode is true, and if the selected outcome is not upgrade
        if (this.placeableTiles[i][j] && this.placingMode == true && this.turretSelected != 4) 
        {
            //if player has enough points
            if (this.points >= this.costs[this.turretSelected])
            {
            //subtract correct amount of points from player total
            this.points -= this.costs[this.turretSelected];
            this.updatePointDisplay();

            this.sound.play("soundPlace", {volume: 0.1});

            //make a new turre at this tile and add to turret group
            let turret = new Turret(this, j * this.TILESIZE + this.TILESIZE/2, i * this.TILESIZE + this.TILESIZE/2, this.turretSelected);
            my.turrets.add(turret);

            //make the turret interactive
            turret.setInteractive();

            //event listener for pointer over (hover) events
            turret.on('pointerover', function(pointer) {
                turret.highlightTurret(); //highlight when hovering
            });

            //event listener for pointer out events
            turret.on('pointerout', function(pointer) {
                turret.normalizeTurret(); //reset to normal when cursor moves away
            });

            //event listener for pointer down (click) events
            turret.on('pointerdown', function(pointer) {
                turret.upgrade(); //upgrade if clicked on
            });

            //handle collision between projectile and enemy
            let enemyGroups = [my.opportunities, my.spirits, my.sojourners, my.curiosities, my.perseverances]; //ugfhhhhh
            //handle collision between this turret projectile and each enemy group
            enemyGroups.forEach(group => {
                this.physics.add.overlap(turret.projectiles, group, (enemy, projectile) => { //phaser why are you like this
                projectile.y = 5000;
                enemy.takeDamage(projectile);
                });
            });
    
            //mark this tile as non-placeable
            this.placeableTiles[i][j] = false;
    
            //reset placing mode to update if its active
            if (this.placingMode) {
                this.togglePlacingMode();
                this.togglePlacingMode();
            }
        }
        else //player does not have enough points
        {
            //show pop up communicating that player does not have enough funds for this action
            this.insufficientFundsPopUp(pointer.x /SCALE + 5, pointer.y /SCALE - 10);
        }
    }   
    }

    //toggle placing mode based on if placing mode is already true
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
    
    //turn on grid and highlights, swap out some UI
    enablePlacingMode()
    {
        //draw the grid
        this.gridGraphics = this.drawGrid();
        //show placement instructions instead of placement mode enter instructions
        my.text.placementInstructions.setVisible(true);
        my.text.pmEnterInstructions.setVisible(false);
        //show the turret menu
        this.popUpContainer.setVisible(true);
        //placing mode is active
        this.placingMode = true;
        //highlight tiles appropriately
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

    //turn off grid and highlights, swap out some UI
    disablePlacingMode()
    {
        //set placing mode inactive
        this.placingMode = false;
        //remove the highlights
        this.highlights.forEach(highlight => highlight.destroy());
        this.highlights = [];
        //clear the grid
        this.gridGraphics.clear();
        //turn off menu
        this.popUpContainer.setVisible(false);
        //show placement mode enter instructions instead of placement instructions
        my.text.placementInstructions.setVisible(false);
        my.text.pmEnterInstructions.setVisible(true);

    }

    //conversion helper method
    tiletoWorld(tile) 
    {
        return tile * this.TILESIZE;
    }

    ///////update game state

    //set the turret placement type
    setMode(mode)
    {
        //if its different than what is currently set
        if (this.turretSelected != mode && this.placingMode == true)
        {
            //update variable and display
            this.turretSelected = mode;
            this.currentText.setText("current selection: " + this.turretSelected);
            this.sound.play("soundSwitch", {volume: 0.6}); 
        }

    }

    //update displayed points
    updatePointDisplay()
    {
        my.text.pointTracker.setText(":" + ("00000" + this.points).slice(-5));
    }

    //update health and displayed health
    updateHealth()
    {
        this.health--;
        this.sound.play("soundOuch", {volume: 0.08});

        //for each element in the health bar arrays
        for (let i = 0; i < 4; i++) 
        {
            my.sprite.fullHearts[i].visible = i < this.health; //if i is less than current player health, full heart is visible
            my.sprite.emptyHearts[i].visible = i >= this.health; //if i is greater than current player health, empty heart is visible
        }
    }

    //begin a new wave or win scenario
    updateWave()
    {
        //increment wave
        this.currWave++;

        if (this.currWave <= 4){ //only four waves in this game
            this.waveActive = true;

            //delayed update so that sounds dont overlap and its not too jarring
            this.time.delayedCall(1000, () => {
                this.sound.play('soundWave', {volume: 0.1});
                //update display
                my.text.currentWaveDisplay.setText("WAVE:" + this.currWave);
                //give player some points as a reward
                this.points += 100;
                this.updatePointDisplay();
            }, [], this);

            //get wave configuration for the current wave
            let waveConfig = this.waves[this.currWave - 1];
        
            //create an array to hold all enemies to be activated in this wave
            let enemiesToActivate = [];

            //iterate over each type in the wave configuration
            for (let typeIndex = 0; typeIndex < waveConfig.length; typeIndex++)
            {
                let enemyCount = waveConfig[typeIndex];
                //get the correct enemy group based on typeIndex
                let enemyGroup;
                switch (typeIndex) 
                {
                    case 0: enemyGroup = my.opportunities; break;
                    case 1: enemyGroup = my.spirits; break;
                    case 2: enemyGroup = my.sojourners; break;
                    case 3: enemyGroup = my.curiosities; break;
                    case 4: enemyGroup = my.perseverances; break;
                }
            //add the indicated number of enemies of each type to the array
            for (let i = 0; i < enemyCount; i++) {
                enemiesToActivate.push(enemyGroup.getChildren()[i]);
                }
            }

            //shuffle the array to randomize the spawn order of enemies
            Phaser.Utils.Array.Shuffle(enemiesToActivate);

            //activate enemies based on the shuffled order with a delay between each spawn
            let delay = 800;

            for (let i = 0; i < enemiesToActivate.length; i++) 
            {
                let enemy = enemiesToActivate[i];
                this.time.addEvent({
                    delay: delay,
                    callback: () => {
                        enemy.makeActive();
                        enemy.health = enemy.MAXHEALTH + (2 * this.currWave)
                    },
                    callbackScope: this
                });
                delay += Phaser.Math.Between(1000, 2500);
            }

            //wait a little bit before setting wave active to false 
            //to prevent game from running through all the waves immediately while there are no enemies at beginning of wave
            this.time.addEvent({
                delay: 4000,
                callback: () => {
                    this.waveActive = false;
                },
                callbackScope: this
            });
        } 
        else { //if all waves complete, initiate win sequence
            this.winGame();
        }
    }

    //////placing mode graphics

    //highlight valid tiles in green
    highlightTile(x, y)
    {
        let rect = this.add.rectangle(x * this.TILESIZE, y * this.TILESIZE, this.TILESIZE, this.TILESIZE, 0xacffca, 0.5);
        rect.setOrigin(0).setDepth(10);
        this.highlights.push(rect);
    }

    //highlight invalid tiles in red
    notThisTile(x, y)
    {
        let rect = this.add.rectangle(x * this.TILESIZE, y * this.TILESIZE, this.TILESIZE, this.TILESIZE, 0xea9999, 0.5);
        rect.setOrigin(0).setDepth(10);
        this.highlights.push(rect);

    }

    //grid that holds spaces where turrets can be placed
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

        //vertical lines
        for (let x = 0; x <= this.map.widthInPixels; x += this.TILESIZE) 
        {
            graphics.lineBetween(x, 0, x, this.map.heightInPixels).setDepth(10);
        }

        //horizontal lines
        for (let y = 0; y <= this.map.heightInPixels; y += this.TILESIZE) {
            graphics.lineBetween(0, y, this.map.widthInPixels, y).setDepth(10);
            
        }

        graphics.strokePath();
        return graphics;
    }


    //uses the tile layer information in this.map and outputs an array which contains the tile ids of the visible tiles on screen.
    //this array can then be given to Easystar for use in path finding.
    layersToGrid(arrayOfLayers) {
        let grid = [];
        //initialize grid as two-dimensional array
        for (let y = 0; y < this.map.height; y++) 
            {
                grid[y] = [];
                for (let x = 0; x < this.map.width; x++) {
                grid[y][x] = 0; //initialize all tiles to 0
                }
            }

        //loop over layers to find tile IDs, store in grid
        arrayOfLayers.forEach(layer => {
            for (let y = 0; y < this.map.height; y++) {
                for (let x = 0; x < this.map.width; x++) {
                    let tile = layer.getTileAt(x, y);
                    if (tile !== null) {
                    grid[y][x] = tile.index-1; //was having an off by one error
                    }
                }
            }
        });

        return grid;
    }

    /////popups!!

    //pop up turret creation menu
    menuPopUp() {
        //use container to make handling easier :3
        this.popUpContainer = this.add.container(0,0);
        //graphics object for the background
        this.popUpBackground = this.add.graphics();
        this.popUpBackground.fillStyle(0xfab49b, 0.9);
        this.popUpBackground.lineStyle(1, 0xffffff, 1);
        this.popUpBackground.fillRoundedRect(0, 0, this.tiletoWorld(10), this.tiletoWorld(12), 10);
        this.popUpBackground.strokeRoundedRect(0, 0, this.tiletoWorld(10), this.tiletoWorld(12), 10);
        this.popUpContainer.add(this.popUpBackground);

        //explanation text
        this.explanationText = this.add.bitmapText(this.tiletoWorld(5), this.tiletoWorld(1), "thick", " press num key to select\ntype of turret to create").setOrigin(0.5).setScale(0.75);
        this.popUpContainer.add(this.explanationText);

        ////descriptions of each turret type 
        //chara
        this.charaKey = this.add.sprite(this.tiletoWorld(1.5), this.tiletoWorld(2.5), "platformer_characters", "tile_0000.png").setScale(0.85);
        this.charaTitle = this.add.bitmapText(this.tiletoWorld(3), this.tiletoWorld(1.75), "thick", "1 - CHARA <cost:"+ this.costs[1]+ ">").setOrigin(0).setScale(0.7);
        this.charaDesc = this.add.bitmapText(this.tiletoWorld(3), this.tiletoWorld(2.25), "thick", "base speed: medium\nbase range: medium\nbase damage: 1").setOrigin(0).setScale(0.6);
        this.popUpContainer.add(this.charaDesc); this.popUpContainer.add(this.charaTitle); this.popUpContainer.add(this.charaKey);

        //enif 
        this.enifKey = this.add.sprite(this.tiletoWorld(1.5), this.tiletoWorld(5), "platformer_characters", "tile_0004.png").setScale(0.85);
        this.enifTitle = this.add.bitmapText(this.tiletoWorld(3), this.tiletoWorld(4.25), "thick", "2 - ENIF <cost:" + this.costs[2]+ ">").setOrigin(0).setScale(0.7);
        this.enifDesc = this.add.bitmapText(this.tiletoWorld(3), this.tiletoWorld(4.75), "thick", "base speed: fast\nbase range: large\nbase damage: 1").setOrigin(0).setScale(0.6);
        this.popUpContainer.add(this.enifDesc); this.popUpContainer.add(this.enifTitle); this.popUpContainer.add(this.enifKey);

        //rigel
        this.rigelKey = this.add.sprite(this.tiletoWorld(1.5), this.tiletoWorld(7.5), "platformer_characters", "tile_0002.png").setScale(0.85);
        this.rigelTitle = this.add.bitmapText(this.tiletoWorld(3), this.tiletoWorld(6.75), "thick", "3 - RIGEL <cost:"+ this.costs[3]+ ">").setOrigin(0).setScale(0.7);
        this.rigelDesc = this.add.bitmapText(this.tiletoWorld(3), this.tiletoWorld(7.25), "thick", "base speed: slow\nbase range: small\nbase damage: 2").setOrigin(0).setScale(0.6);
        this.popUpContainer.add(this.rigelDesc); this.popUpContainer.add(this.rigelTitle); this.popUpContainer.add(this.rigelKey);

        //orr upgrade
        this.upgradeKey = this.add.sprite(this.tiletoWorld(1.5), this.tiletoWorld(9.75), "sparkle1").setScale(0.85);
        this.upgradeTitle = this.add.bitmapText(this.tiletoWorld(3), this.tiletoWorld(9.25), "thick", "4 - UPGRADE").setOrigin(0).setScale(0.7);
        this.upgradeText = this.add.bitmapText(this.tiletoWorld(3), this.tiletoWorld(9.75), "thick", "spend " +this.costs[4] + "\nupgrade existing turret").setOrigin(0).setScale(0.6);
        this.popUpContainer.add(this.upgradeText); this.popUpContainer.add(this.upgradeTitle); this.popUpContainer.add(this.upgradeKey);
        

        //curent selection
        this.currentText = this.add.bitmapText(this.tiletoWorld(5), this.tiletoWorld(11.25), "thick", " current selection: " + this.turretSelected).setOrigin(0.5).setScale(0.75);
        this.popUpContainer.add(this.currentText);

        //set position and depth
        this.popUpContainer.setPosition(16, 16).setDepth(10000);
        //initially hide the pop-up
        this.popUpContainer.setVisible(false);
    }

    //show pop up if player does not have enough points for something
    insufficientFundsPopUp(x, y)
    {
        this.sound.play("soundError", {volume: 0.07});
        this.IFPopUpContainer = this.add.container(0,0);
        //graphics object for the background
        this.IFPopUpBackground = this.add.graphics();
        this.IFPopUpBackground.lineStyle(1, 0xffffff, 1);
        this.IFPopUpBackground.fillStyle(0xfab49b, 0.9);
        this.IFPopUpBackground.fillRoundedRect(0, 0, this.tiletoWorld(5.5), this.tiletoWorld(1), 2);
        this.IFPopUpBackground.strokeRoundedRect(0, 0, this.tiletoWorld(5.5), this.tiletoWorld(1), 2);
        this.IFPopUpContainer.add(this.IFPopUpBackground);

        //text
        this.insufficientFunds = this.add.bitmapText(this.tiletoWorld(2.75), this.tiletoWorld(0.6), "thick", "INSUFFICIENT FUNDS").setOrigin(0.5).setScale(0.55);
        this.IFPopUpContainer.add(this.insufficientFunds);

        //set position and depth
        this.IFPopUpContainer.setPosition(x, y).setDepth(10000);
        //initially hide the pop-up
        this.IFPopUpContainer.setVisible(true);
        //fade out
        this.tweens.add({
            targets: this.IFPopUpContainer,
            alpha: 0,
            duration: 1000,
            ease: 'Sine.In',
            onComplete: function() {
                if (this.IFPopUpContainer) {
                    this.IFPopUpContainer.destroy();
                }
            },
            onCompleteScope: this
        });

    }

    //show pop up if max upgrade level of a turret has already been reached
    maxUpgradeLevelPopUp(x, y)
    {
        this.sound.play("soundError", {volume: 0.07});
        this.MUPopUpContainer = this.add.container(0,0);
        //graphics object for the background
        this.MUPopUpBackground = this.add.graphics();
        this.MUPopUpBackground.lineStyle(1, 0xffffff, 1);
        this.MUPopUpBackground.fillStyle(0xfab49b, 0.9);
        this.MUPopUpBackground.fillRoundedRect(0, 0, this.tiletoWorld(7), this.tiletoWorld(1), 2);
        this.MUPopUpBackground.strokeRoundedRect(0, 0, this.tiletoWorld(7), this.tiletoWorld(1), 2);
        this.MUPopUpContainer.add(this.MUPopUpBackground);

        //text
        this.maxUpgradeLevel = this.add.bitmapText(this.tiletoWorld(3.55), this.tiletoWorld(0.6), "thick", "MAX UPGRADE LEVEL REACHED").setOrigin(0.5).setScale(0.55);
        this.MUPopUpContainer.add(this.maxUpgradeLevel);

        //set position and depth
        this.MUPopUpContainer.setPosition(x, y).setDepth(10000);
        //initially hide the pop-up
        this.MUPopUpContainer.setVisible(true);
        //fade out
        this.tweens.add({
            targets: this.MUPopUpContainer,
            alpha: 0,
            duration: 1000,
            ease: 'Sine.In',
            onComplete: function() {
                if (this.MUPopUpContainer) {
                    this.MUPopUpContainer.destroy();
                }
            },
            onCompleteScope: this
        });

    }

    //check enemy active
    //get first inactive enemy in the group
    getFirstIA(group)
    {
        for (let enemy of group.getChildren()) {
        if (!enemy.active) {
            return enemy; //return the first inactive enemy
        }
    }
    return null; //return null if no inactive enemy is found
    }

    //get the first active enemy in the group
    getFirstA(group)
    {
        for (let enemy of group.getChildren()) {
        if (enemy.active) {
            return enemy; //return the first active enemy
        }
    }
    return null; //return null if no inactive enemy is found
    }

    //check if all enemies are inactive
    allIA()
    {
        for (let enemyGroup of my.enemies.getChildren()){
            if (this.getFirstA(enemyGroup))
                {
                    return false; //if any are active, return false
                }
        }
        return true;
    }

    //////game ends
    
    winGame()
    {
        this.gameEnd = true;
        this.sound.play("soundWin", {volume: 0.1});
        this.scene.start("endWin");

    }

    loseGame()
    {
        this.gameEnd = true;
        this.sound.play("soundLose", {volume: 0.1});
        this.scene.start("endLose");

    }

    update()
    {

        //handle wave changes
        //if all enemies inactive, start the next wave
        if (this.allIA() && this.gameEnd == false && this.waveActive == false)
        {
            this.updateWave();
        }

        //if health <= 0, initiate loss sequence
        if (this.health <= 0 && this.gameEnd == false)
            {
                this.loseGame();
            }

    }

}