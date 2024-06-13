//enemy class
//handles enemy variables and behavior
class Enemy extends Phaser.Physics.Arcade.Sprite
{
    constructor(scene, x, y, type, finder) //scene, x, y, designated enemy type [between 0 and 4], finder
    {

        super(scene, x, y, "platformer_characters", "tile_0021.png");

        this.SPEED; //controls how fast enemy moves
        this.ANIMATION; //specifies name of this enemy's animation
        this.POINTS; //how many points player receives for defeating enemy
        this.MAXHEALTH; //original max health of enemy

        //define unique characteristics first
        switch(type)
        {
            case 0: //opportunity
                this.SPEED = Phaser.Math.Between (640, 700);
                this.setTexture("platformer_characters", "tile_0021.png");
                this.setScale(0.6).setOrigin(0,0);
                this.ANIMATION = "oppyWalk";
                this.POINTS = 10;
                this.MAXHEALTH = 6;
                break;

            case 1: //spirit
                this.SPEED = Phaser.Math.Between (200, 300);
                this.setTexture("platformer_characters", "tile_0024.png");
                this.setScale(0.6).setOrigin(0,0);
                this.ANIMATION = "spiritFlap";
                this.POINTS = 20;
                this.MAXHEALTH = 2;
                break;
            
            case 2: //sojourner
                this.SPEED = Phaser.Math.Between (500, 580);
                this.setTexture("platformer_characters", "tile_0015.png");
                this.setScale(0.8).setOrigin(0,0);
                this.ANIMATION = "sojWalk";
                this.POINTS = 15;
                this.MAXHEALTH = 5;
                break;
            
            case 3: //curiosity
                this.SPEED = Phaser.Math.Between (380, 450);
                this.setTexture("platformer_characters", "tile_0018.png");
                this.setScale(0.7).setOrigin(0,0);
                this.ANIMATION = "curiWalk";
                this.POINTS = 25;
                this.MAXHEALTH = 4;
                break;

            case 4: //perseverance
                this.SPEED = Phaser.Math.Between (650, 800);
                this.setTexture("platformer_characters", "tile_0011.png");
                this.setScale(0.9).setOrigin(0,0);
                this.ANIMATION = 'persWalk';
                this.POINTS = 20;
                this.MAXHEALTH = 12;
                break;

        }

        //they're named after mars rovers :)

        //set other initial vars
        this.finder = finder; //finder used to navigation
        this.TILESIZE = 16; //tilesize. used in calculations
        this.ORGINX = x; //starting x
        this.ORGINY = y; //starting y
        this.health = this.MAXHEALTH; //varying health


        //add sprite to scene
        scene.add.existing(this);
        scene.physics.add.existing(this); 
        this.flipX = true;

        //enemies shouldn't immediately start
        this.makeInactive();
        this.active = false;


    }

    //////////helper functions

    //find the path for the enemy to traverse and start movement
    findPath() {

        //convert enemy position from pixels to grid coordinates
        let fromX = Math.floor(this.ORGINX / this.TILESIZE);
        let fromY = Math.floor(this.ORGINY / this.TILESIZE);
    
        //convert goal position from pixels to grid coordinates
        let toX = Math.floor(my.sprite.donutGoal.x / this.TILESIZE);
        let toY = Math.floor(my.sprite.donutGoal.y / this.TILESIZE);
    
        //console.log('Going from (' + fromX + ',' + fromY + ') to (' + toX + ',' + toY + ')'); //debug
    
        this.finder.findPath(fromX, fromY, toX, toY, (path) => {
            if (path === null) {
                console.warn("Path was not found."); //debug
            } else {
    
                //convert path back to pixel coordinates
                let pixelPath = path.map(step => ({
                    x: step.x * this.TILESIZE,
                    y: step.y * this.TILESIZE
                }));

                //move the enemy
                this.moveEnemy(pixelPath); //moveEnemy only works on a pixel path
            }
        });
    
        this.finder.calculate(); //ask EasyStar to compute the path
    }

    //move enemy along calculated path
    moveEnemy(path) {

        if (path.length === 0) //no  need to move
        {
            return;
        }
    
        let tweens = []; //var to hold all the tweens between points

        //create tweens along path
        for (let i = 0; i < path.length - 1; i++) {
            let ex = path[i + 1].x + Phaser.Math.Between (-4, 4); //random to add some variance in enemy motion
            let ey = path[i + 1].y + Phaser.Math.Between (-2, 2); //random to add some variance in enemy motion
            tweens.push({ //push to tweens array
                targets: this,
                x: ex,
                y: ey,
                duration: this.SPEED,
                ease: 'Quadratic.Out'
            });
        }

        //chain together all the tweens in array
        this.scene.tweens.chain({
            targets: this,
            tweens: tweens,
            onComplete: () => {
                //if enemy reached the end of its tween (donut goal)
                this.makeInactive(); //make enemy inactive
                this.scene.updateHealth(); //reduce player health in the scene
            }

        });
    }

    //make enemy become active
    makeActive()
    {
        //active and visible
        this.setActive(true);
        this.setVisible(true);
        //reset location
        this.y = this.ORGINY;
        this.x = this.ORGINX;
        //reset health
        this.health = this.MAXHEALTH;
        //start moving along path again
        this.findPath();
        //start playing animation again
        this.anims.play(this.ANIMATION);

    }

    //make enemy inactive
    makeInactive()
    {
        //stop moving enemy along the path
        this.scene.tweens.killTweensOf(this);
        //not active or visible
        this.setActive(false);
        this.setVisible(false);
        //move offscreen just to be safe
        this.y = -1000;

    }

    //take damage from a turret projectile
    takeDamage(projectile) //pass projectile to handle correct damage amount
    {
        this.health -= projectile.DAMAGE; //subtract damage amount from enemy health

        if (this.health <= 0) //enemy dies
            {
                this.scene.sound.play("soundPerish", {volume: 0.05});
                //play perish animation
                let enemyPerish = this.scene.add.sprite(this.x, this.y, "sparkle1").setScale(1).play("perish");
                enemyPerish.on('animationcomplete-perish', () => {
                    enemyPerish.destroy(); //destroy the sprite when the animation completes
                });
                //make enemy inactive
                this.makeInactive();
                //give player correct amount of points
                this.scene.points += this.POINTS;
                this.scene.updatePointDisplay();

            }
    }

    //never reached
    update()
    {

    }

}