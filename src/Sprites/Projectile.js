//projectile class
//handles projectile behavior
class Projectile extends Phaser.Physics.Arcade.Sprite
{
    constructor(scene, x, y)
    {
        super(scene, x, y, "p_burger");

        //set initial vars
        this.SPEED = 265; //speed of movement
        this.DAMAGE = 1;
        this.setScale(0.6).setDepth(-1);

        //give projectile physics
        this.scene.physics.add.existing(this);

    }

    ///////helpers

    //disable the projectile
    disableProj()
    {
        this.setActive(false);
        this.setVisible(false); 
    }

    //handle firing bullets
    fire(x, y, target) { //pass targeted enemy
        //make active and true
        this.setActive(true);
        this.setVisible(true);
        //set position to x and y of turret
        this.setPosition(x, y);
        //move projectile to targeted enemy
        this.scene.physics.moveToObject(this, target, this.SPEED);
    }

    update()
    {
        //disable if offscreen
        if (this.y >= this.scene.game.config.height + this.displayHeight/2 || this.y <= 0 - this.displayHeight/2)
            {
                this.disableProj();
            }

    }
}