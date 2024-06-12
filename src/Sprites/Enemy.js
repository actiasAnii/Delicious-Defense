class Enemy extends Phaser.Physics.Arcade.Sprite
{
    constructor(scene, x, y, type, finder)
    {

        super(scene, x, y, "platformer_characters", "tile_0021.png");

        //define unique characteristics first
        switch(type)
        {
            case 0: //opportunity
                this.SPEED = Phaser.Math.Between (700, 750);
                this.setTexture("platformer_characters", "tile_0021.png");
                this.setScale(0.6).setOrigin(0,0);
                this.ANIMATION = "oppyWalk";
                this.POINTS = 60;
                this.MAXHEALTH = 5;
                break;

            case 1: //spirit
                this.SPEED = Phaser.Math.Between (300, 350);
                this.setTexture("platformer_characters", "tile_0024.png");
                this.setScale(0.6).setOrigin(0,0);
                this.ANIMATION = "spiritFlap";
                this.POINTS = 30;
                this.MAXHEALTH = 2;
                break;
            
            case 2: //sojourner
                this.SPEED = Phaser.Math.Between (600, 650);
                this.setTexture("platformer_characters", "tile_0015.png");
                this.setScale(0.8).setOrigin(0,0);
                this.ANIMATION = "sojWalk";
                this.POINTS = 25;
                this.MAXHEALTH = 4;
                break;
            
            case 3: //curiosity
                this.SPEED = Phaser.Math.Between (400, 550);
                this.setTexture("platformer_characters", "tile_0018.png");
                this.setScale(0.7).setOrigin(0,0);
                this.ANIMATION = "curiWalk";
                this.POINTS = 40;
                this.MAXHEALTH = 3;
                break;

            case 4: //perseverance
                this.SPEED = Phaser.Math.Between (800, 1000);
                this.setTexture("platformer_characters", "tile_0011.png");
                this.setScale(0.9).setOrigin(0,0);
                this.ANIMATION = 'persWalk';
                this.POINTS = 50;
                this.MAXHEALTH = 7;
                break;

        }

        //set initial vars
        this.finder = finder;
        this.TILESIZE = 16;
        this.ORGINX = x;
        this.ORGINY = y;
        this.health = this.MAXHEALTH;


        //add sprite to scene
        //this.setScale(0.6).setOrigin(0,0);
        scene.add.existing(this);
        scene.physics.add.existing(this); 
        this.flipX = true;

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
    
        //console.log('Going from (' + fromX + ',' + fromY + ') to (' + toX + ',' + toY + ')');
    
        this.finder.findPath(fromX, fromY, toX, toY, (path) => {
            if (path === null) {
                console.warn("Path was not found.");
            } else {
    
                //convert path back to pixel coordinates
                let pixelPath = path.map(step => ({
                    x: step.x * this.TILESIZE,
                    y: step.y * this.TILESIZE
                }));
    
                this.moveEnemy(pixelPath);
            }
        });
    
        this.finder.calculate(); //ask EasyStar to compute the path
    }

    //move enemy along calculated path
    moveEnemy(path) {
        if (path.length === 0) {
            return;
        }
    
        let tweens = [];
    
        for (let i = 0; i < path.length - 1; i++) {
            let ex = path[i + 1].x + Phaser.Math.Between (-4, 4);
            let ey = path[i + 1].y + Phaser.Math.Between (-2, 2);
            tweens.push({
                targets: this,
                x: ex,
                y: ey,
                duration: this.SPEED,
                ease: 'Quadratic.Out'
            });
        }
    
        this.scene.tweens.chain({
            targets: this,
            tweens: tweens,
            onComplete: () => {
                this.makeInactive();
                this.scene.updateHealth();
            }

        });
    }

    makeActive()
    {
        this.setActive(true);
        this.setVisible(true);
        this.y = this.ORGINY;
        this.x = this.ORGINX;
        this.health = this.MAXHEALTH;
        this.findPath();
        this.anims.play(this.ANIMATION);
        this.active = true;

    }

    makeInactive()
    {
        this.scene.tweens.killTweensOf(this);
        this.setActive(false);
        this.setVisible(false);
        this.y = -1000;
        this.active = false;

    }

    takeDamage(projectile)
    {
        this.health -= projectile.DAMAGE;
        console.log("enemy health: " + this.health);
        if (this.health <= 0)
            {
                this.scene.sound.play("soundPerish", {volume: 0.05});
                let enemyPerish = this.scene.add.sprite(this.x, this.y, "sparkle1").setScale(1).play("perish");
                enemyPerish.on('animationcomplete-perish', () => {
                    enemyPerish.destroy(); //destroy the sprite when the animation completes
                });
                this.makeInactive();
                this.scene.points += this.POINTS;
                this.scene.updatePointDisplay();

            }
    }

    update()
    {

    }

}