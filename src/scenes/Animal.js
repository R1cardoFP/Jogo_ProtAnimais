export default class Animal extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, frame = 0, key = 'dogs') {
        super(scene, x, y, key, frame);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setOrigin(0.5, 1);
        const fw = this.frame ? this.frame.width : 16;
        const fh = this.frame ? this.frame.height : 16;
        const HITBOX_W = 10;
        const HITBOX_H = 12;
        if (this.body && this.body.setSize) {
            this.body.setSize(HITBOX_W, HITBOX_H);
            this.body.setOffset(Math.round((fw - HITBOX_W) / 2), Math.round(fh - HITBOX_H));
        }

        this.body.allowGravity = false;
        this._rescued = false;
        this.setDepth(45);
    }

    rescue() {
        if (this._rescued) return;
        this._rescued = true;
        this.disableBody(true, true);
        this.emit('rescued', this);
    }
}