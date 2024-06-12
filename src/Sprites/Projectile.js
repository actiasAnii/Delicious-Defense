class Projectile extends Phaser.Physics.Arcade.Sprite
{
    constructor(scene, x, y)
    {
        super(scene, x, y, "p_burger");

        //set initial vars
        this.SPEED = 260;
        this.scene = scene;
        this.DAMAGE = 1;
        this.setScale(0.6).setDepth(-1);

        //handle going offscreen
        this.scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);

    }

    //helpers

    disableProj()
    {
        console.log("disabled");
        this.setActive(false);
        this.setVisible(false); 
    }

    //handle firing bullets
    fire(x, y, target) {
        console.log("firing!");
        this.setActive(true);
        this.setVisible(true);
        this.setPosition(x, y);
        this.scene.physics.moveToObject(this, target, this.SPEED);
        this.lifespan = 2000;
    }

    update()
    {

        if (this.y >= this.scene.game.config.height + this.displayHeight/2 || this.y <= 0 - this.displayHeight/2)
            {
                this.disableProj();
            }

    }
}