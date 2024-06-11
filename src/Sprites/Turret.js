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
        //these will be set in a switch

        switch (type)
        {
            case 1: //chara
                this.RANGE = 150;
                this.COOLDOWN = 200;
                this.DAMAGE = 1;
                this.PROJ_TEXTURE = "p_burger";
                this.HIGHLIGHT_TEXTURE = "hl_chara";
                this.TEXTURE = "tile_0000.png";
                this.ANIMATION = "turrChara"
                break;
            
            case 2: //enif
                this.RANGE = 250;
                this.COOLDOWN = 150;
                this.DAMAGE = 1;
                this.PROJ_TEXTURE = "p_musubi";
                this.HIGHLIGHT_TEXTURE = "hl_enif";
                this.TEXTURE = "tile_0004.png";
                this.ANIMATION = "turrEnif"
                break;

            case 3: //rigel
                this.RANGE = 100;
                this.COOLDOWN = 250;
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

       //find the closest enemy within range
       findTarget() {
        let enemies = my.enemies.getChildren();
        let closestEnemy = null;
        let closestDistance = this.RANGE;

        enemies.forEach(enemy => {
            let distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (distance < closestDistance) {
                closestEnemy = enemy;
                closestDistance = distance;
            }
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
        }

    }

    normalizeTurret()
    {
        this.anims.play(this.ANIMATION, true); //make an animations play function for when theres variation
        this.setTexture("platformer_characters", this.TEXTURE).setScale(0.7);

    }


    upgrade()
    {
        if (this.scene.turretSelected == 4 && this.scene.placingMode == true)
        {
            console.log("turret upgraded");
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

                            //reset cooldown to another random number
                            this.cooldown = this.COOLDOWN;
                        }
                }
            }


    }
}