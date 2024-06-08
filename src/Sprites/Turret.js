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
        this.RANGE = range; //detection range for enemies
        this.target = null; //current target enemy

        //debug eable physics body for the turret
        this.body.setImmovable(true);
    }

   
    update() {
        this.findTarget();

        if (this.target) {
            this.rotateTurret();
        }

        //add firing
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
        //if no target, don't rotate
        if (!this.target)
            return;
    
        //calculate angle between turret and target
        let angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
    
        //adjust the angle so that the top of the turret points towards the target
        angle += Math.PI / 2;
    
        //set the angle
        this.setRotation(angle);
    }
}