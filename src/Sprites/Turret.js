class Turret extends Phaser.Physics.Arcade.Sprite
{
    constructor(scene, x, y, type)
    {
        super(scene, x, y, "platformer_characters", "tile_0000.png");

        //add sprite to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setOrigin(0.5, 0.5).setScale(0.7);

        //set initial vars
        this.scene = scene;
        this.target = null; //current target enemy
        this.cooldown = 10;
        this.upgradeLvl = 0;
        //these will be set in a switch

        switch (type)
        {
            case 1: //chara
                this.RANGE = 120;
                this.COOLDOWN = 115;
                this.DAMAGE = 1;
                this.PROJ_TEXTURE = "p_burger";
                this.HIGHLIGHT_TEXTURE = "hl_chara";
                this.TEXTURE = "tile_0000.png";
                this.ANIMATION = "turrChara"
                break;
            
            case 2: //enif
                this.RANGE = 200;
                this.COOLDOWN = 80;
                this.DAMAGE = 1;
                this.PROJ_TEXTURE = "p_musubi";
                this.HIGHLIGHT_TEXTURE = "hl_enif";
                this.TEXTURE = "tile_0004.png";
                this.ANIMATION = "turrEnif"
                break;

            case 3: //rigel
                this.RANGE = 60;
                this.COOLDOWN = 150;
                this.DAMAGE = 2;
                this.PROJ_TEXTURE = "p_sushi";
                this.HIGHLIGHT_TEXTURE = "hl_rigel";
                this.TEXTURE = "tile_0002.png";
                this.ANIMATION = "turrRigel"
                break;

        }


        //debug enable physics body for the turret
        this.body.setImmovable(true);

        //make a projectile group for this turret, pass correct sprite
        this.projectiles = this.scene.physics.add.group({ 
            classType: Projectile, 
            runChildUpdate: true, 
            createCallback: (proj) => {
                proj.setTexture(this.PROJ_TEXTURE);
                proj.DAMAGE = this.DAMAGE;
            }
        });

        this.anims.play(this.ANIMATION, true);

        console.log(this.x, this.y);
    }

    findTarget() {
        let closestEnemy = null;
        let closestDistance = this.RANGE;
        
        //iterate through each enemy group
        let enemyGroups = [my.opportunities, my.spirits, my.sojourners, my.curiosities, my.perseverances];
        
        enemyGroups.forEach(group => {
        group.getChildren().forEach(enemy => {
            let distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (distance < closestDistance) {
                closestEnemy = enemy;
                closestDistance = distance;
            }
        });
        });
        
         this.target = closestEnemy;
    }

    //rotate the turret to face the target enemy
    rotateTurret() {
        let angle;
        //if no target, point straight up
        if (!this.target)
            {
                angle = -Math.PI / 2;
            }
        else 
            {
                //calculate angle between turret and target
                angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);

            }
    
        //adjust the angle so that the top of the turret points towards the target
        angle += Math.PI / 2;
    
        //set the angle
        this.setRotation(angle);
    }

    highlightTurret()
    {
        if (this.scene.placingMode == true)
        {
            this.setTexture(this.HIGHLIGHT_TEXTURE).setScale(0.8); //make a swap texture function for when theres variation
            this.anims.pause();
            this.levelPopUp(this.x + 5, this.y - 15);
        }

    }

    normalizeTurret()
    {
        this.anims.play(this.ANIMATION, true); //make an animations play function for when theres variation
        this.setTexture("platformer_characters", this.TEXTURE).setScale(0.7);
        this.scene.tweens.add({
            targets: this.LVLPopUpContainer,
            alpha: 0,
            duration: 250,
            ease: 'Sine.In',
            onComplete: function() {
                if (this.LVLPopUpContainer) {
                    this.LVLPopUpContainer.destroy();
                }
            },
            onCompleteScope: this.scene
        });

    }

    levelPopUp(x, y)
    {
        this.LVLPopUpContainer = this.scene.add.container(0,0);
        //graphics object for the background
        this.LVLPopUpBackground = this.scene.add.graphics();
        this.LVLPopUpBackground.lineStyle(1, 0xffffff, 1);
        this.LVLPopUpBackground.fillStyle(0xfab49b, 0.9);
        this.LVLPopUpBackground.fillRoundedRect(0, 0, this.scene.tiletoWorld(1.6), this.scene.tiletoWorld(0.75), 2);
        this.LVLPopUpBackground.strokeRoundedRect(0, 0, this.scene.tiletoWorld(1.6), this.scene.tiletoWorld(0.75), 2);
        this.LVLPopUpContainer.add(this.LVLPopUpBackground);

        //text
        this.currLevel = this.scene.add.bitmapText(this.scene.tiletoWorld(0.85), this.scene.tiletoWorld(0.48), "thick", "LVL:"+ this.upgradeLvl).setOrigin(0.5).setScale(0.5);
        this.LVLPopUpContainer.add(this.currLevel);

        //set position and depth
        this.LVLPopUpContainer.setPosition(x, y).setDepth(10000);
        //initially hide the pop-up
        this.LVLPopUpContainer.setVisible(true);
        
    }


    upgrade()
    { 
        //add a check to see if its reached max upgrade level
        if (this.scene.turretSelected == 4 && this.scene.placingMode == true)
        {
            this.upgradeLvl++;
            if (this.upgradeLvl <= 3)
            {
                this.DAMAGE++;
                this.RANGE += 30;
                this.COOLDOWN -= 15;

                console.log("damage, range, speed: " + this.DAMAGE + " " + this.RANGE + " " + this.COOLDOWN)

                //subtract cost from player's points
                this.scene.points = this.scene.points - 50;
                this.scene.updatePointDisplay();

                this.scene.sound.play("soundUP", {volume: 0.08});

                //change displayed level if currently being displayed
                if (this.currLevel && this.currLevel.visible)
                    {
                        this.currLevel.setText("LVL:"+ this.upgradeLvl);
                    }
            }
            else
            {
                this.scene.maxUpgradeLevelPopUp(this.x + 10, this.y - 20)
            }
        }
        
    }

   
    update() {

        //handle rotation
        this.findTarget();
        this.rotateTurret();

        //reduce cooldown
        this.cooldown--;

        if (this.target) {
    
    
            //make turret shoot
            if (this.cooldown <= 0) //after cooldown time has passed
                {
                    //fire a projectile
                    let proj = this.projectiles.get();
                    if (proj) 
                        {
                            proj.fire(this.x, this.y, this.target);
                            this.scene.sound.play("soundFire", {volume: 0.02});

                            //reset cooldown to another random number
                            this.cooldown = this.COOLDOWN;
                        }
                }
            }


    }
}