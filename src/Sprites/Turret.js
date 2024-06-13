//turret class
//handles turret variations and behavior
class Turret extends Phaser.Physics.Arcade.Sprite
{
    constructor(scene, x, y, type) //pass in specified turret type [between 1 and 3]
    {
        super(scene, x, y, "platformer_characters", "tile_0000.png");

        //add sprite to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setOrigin(0.5, 0.5).setScale(0.7);

        //set initial vars
        this.target = null; //current target enemy
        this.cooldown = 10; //varying cooldown between firing. starts low so there isnt huge delay between placement and firing
        this.upgradeLvl = 0; //upgrade level. max of 3

        this.RANGE; //range at which turret can detect targets
        this.COOLDOWN; //cooldown between firing
        this.DAMAGE; //damage delt by this turret's projectiles
        this.PROJ_TEXTURE; //name of projectile texture
        this.HIGHLIGHT_TEXTURE; //name of highlight texture
        this.TEXTURE; //name of texture
        this.ANIMATION; //name of animation
        
        //define unique characteristics
        switch (type)
        {
            case 1: //chara
                this.RANGE = 85;
                this.COOLDOWN = 100;
                this.DAMAGE = 1;
                this.PROJ_TEXTURE = "p_burger";
                this.HIGHLIGHT_TEXTURE = "hl_chara";
                this.TEXTURE = "tile_0000.png";
                this.ANIMATION = "turrChara"
                break;
            
            case 2: //enif
                this.RANGE = 120;
                this.COOLDOWN = 70;
                this.DAMAGE = 1;
                this.PROJ_TEXTURE = "p_musubi";
                this.HIGHLIGHT_TEXTURE = "hl_enif";
                this.TEXTURE = "tile_0004.png";
                this.ANIMATION = "turrEnif"
                break;

            case 3: //rigel
                this.RANGE = 60;
                this.COOLDOWN = 130;
                this.DAMAGE = 2;
                this.PROJ_TEXTURE = "p_sushi";
                this.HIGHLIGHT_TEXTURE = "hl_rigel";
                this.TEXTURE = "tile_0002.png";
                this.ANIMATION = "turrRigel"
                break;

        }
        //they're named after stars :)

        this.BASEDAMAGE = this.DAMAGE; //basedamage. used for calculations


        //debug enable physics body for the turret
        this.body.setImmovable(true);

        //make a projectile group for this turret, pass correct sprite and damage
        this.projectiles = this.scene.physics.add.group({ 
            classType: Projectile, 
            runChildUpdate: true, 
            createCallback: (proj) => {
                proj.setTexture(this.PROJ_TEXTURE);
                proj.DAMAGE = this.DAMAGE;
            }
        });

        //play an extra little active movement animation
        this.anims.play(this.ANIMATION, true);
    }

    ///////helper functions

    //search for a target to aim at
    findTarget() {

        let closestEnemy = null;
        let closestDistance = this.RANGE; //max distance is range
        
        //iterate through each enemy group
        let enemyGroups = [my.opportunities, my.spirits, my.sojourners, my.curiosities, my.perseverances];
        //calculate which is currently closest
        enemyGroups.forEach(group => {
        group.getChildren().forEach(enemy => {
            let distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (distance < closestDistance) {
                closestEnemy = enemy;
                closestDistance = distance;
            }
        });
        });

        //target is current closest enemy
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

    /////hover-related helpers

    //highlight a specific turret. used when hovering over it in placing mode
    highlightTurret()
    {
        if (this.scene.placingMode == true)
        {
            //swap texture out for specified highlight texture + make sprite a bit bigger
            this.setTexture(this.HIGHLIGHT_TEXTURE).setScale(0.8); 
            //pause animation
            this.anims.pause(); //its like ur picking the little guy up
            //show a pop up indicating this turrets currrent level
            this.levelPopUp(this.x + 5, this.y - 15);
        }

    }

    //return turret to normal after previously highlighted
    normalizeTurret()
    {
        //play animation and return texture/scale
        this.anims.play(this.ANIMATION, true);
        this.setTexture("platformer_characters", this.TEXTURE).setScale(0.7);

        //make level pop up fade out and destroy it
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

    //make a pop up to display this turret's level
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

        //show the pop up
        this.LVLPopUpContainer.setVisible(true);
        
    }

    //upgrade this turret
    upgrade()
    { 
        //if current selection is 4 and placing mode is active
        if (this.scene.turretSelected == 4 && this.scene.placingMode == true)
        {
            //if player does not have enough points
            if (this.scene.points < 50)
            {
                //show an insufficient funds pop up
                this.scene.insufficientFundsPopUp(this.x, this.y);
                return;
            }
            //otherwise increase upgrade level
            this.upgradeLvl++;
            if (this.upgradeLvl <= 3) //if less than the max level
            {
                //improve the turret's stats
                this.DAMAGE += (0.5 * this.BASEDAMAGE);
                this.RANGE += 10;
                this.COOLDOWN -= 10;

                //console.log("damage, range, speed: " + this.DAMAGE + " " + this.RANGE + " " + this.COOLDOWN) //debug

                //subtract upgrade cost from player's points
                this.scene.points = this.scene.points - 50;
                this.scene.updatePointDisplay();

                //sound to indicate that upgrade has occured
                this.scene.sound.play("soundUP", {volume: 0.08});

                //change displayed level if it is currently being displayed
                if (this.currLevel && this.currLevel.visible)
                    {
                        this.currLevel.setText("LVL:"+ this.upgradeLvl);
                    }
            }
            else //greater than max level
            {
                //show pop up indicating that max upgrade level has already been reached
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

        //if there is a target in range
        if (this.target) 
        {
    
            //make turret shoot
            if (this.cooldown <= 0) //after cooldown time has passed
                {
                    //fire a projectile
                    let proj = this.projectiles.get();
                    if (proj) 
                        {
                            proj.fire(this.x, this.y, this.target);
                            this.scene.sound.play("soundFire", {volume: 0.02});

                            //reset cooldown
                            this.cooldown = this.COOLDOWN;
                        }
                }
        }

    }


}