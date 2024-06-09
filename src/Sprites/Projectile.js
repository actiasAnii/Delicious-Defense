class Projectile extends Phaser.Physics.Arcade.Sprite
{
    constructor(scene, x, y)
    {
        super(scene, x, y, "heart");

        //set initial vars
        //might pass in a couple
        this.SPEED = 250;
        this.lifespan = 2000;
        this.scene = scene;

        //handle going offscreen
        this.scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);
        this.on('worldbounds', this.onWorldBounds, this);


    }

    //helpers
    onWorldBounds() {
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
        this.lifespan--;
        if (this.lifespan <= 0) {
            this.setActive(false);
            this.setVisible(false);
        }

    }
}