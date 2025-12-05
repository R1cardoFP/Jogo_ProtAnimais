export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, key = 'player', frame = 6) {
        super(scene, x, y, key, frame);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        if (this.body && this.body.setSize) {
            this.body.setSize(10, 12);
            this.body.setOffset(3, 4);
        }
        this.setDepth(50);
    }

    update(cursors) {
        if (!this.body) return;
        this.body.setVelocity(0);
        const speed = 80;

        if (cursors.left.isDown) this.body.setVelocityX(-speed);
        else if (cursors.right.isDown) this.body.setVelocityX(speed);
        if (cursors.up.isDown) this.body.setVelocityY(-speed);
        else if (cursors.down.isDown) this.body.setVelocityY(speed);

        if (cursors.up.isDown) {
            this.anims.play('up', true);
            this.flipX = false;
        } else if (cursors.down.isDown) {
            this.anims.play('down', true);
            this.flipX = false;
        } else if (cursors.left.isDown) {
            this.anims.play('esquerdadireita', true);
            this.flipX = true;
        } else if (cursors.right.isDown) {
            this.anims.play('esquerdadireita', true);
            this.flipX = false;
        } else {
            this.anims.stop();
            this.setFrame(0);
        }
    }
}