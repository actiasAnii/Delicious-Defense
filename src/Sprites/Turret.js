class Turret extends Phaser.Physics.Arcade.Sprite
{
    constructor(scene, x, y, range)
    {
        super(scene, x, y, "platformer_characters", "tile_0000.png");

        //add sprite to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setOrigin(0.5, 0.5).setScale(0.7);

        //set initial vars
        this.scene = scene;
        this.target = null; //current target enemy
        //these will be set in a switch
        this.RANGE = range; //detection range for enemies
        this.cooldown = 10; //for firing delay
        this.DAMAGE = 1;
        this.PROJ_TEXTURE = "p_burger";

        //debug enable physics body for the turret
        this.body.setImmovable(true);

        //make a projectile group for this turret, pass correct sprite
        this.projectiles = this.scene.physics.add.group({ 
            classType: Projectile, 
            runChildUpdate: true, 
            createCallback: (proj) => {
                proj.setTexture(this.PROJ_TEXTURE).setScale(0.5);
            }
        });

        this.anims.play("turrChara", true);

        console.log(this.x, this.y);
    }

   
    update() {
        this.findTarget();
        this.rotateTurret();

        if (this.target) {

            //reduce cooldown
            this.cooldown--;
    
    
            //make turret shoot
            if (this.cooldown <= 0) //after cooldown time has passed
                {
                    //fire a projectile
                    let proj = this.projectiles.get();
                    if (proj) 
                        {
                            proj.fire(this.x, this.y, this.target);

                            //reset cooldown to another random number
                            this.cooldown = 200;
                        }
                }
            }


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
}