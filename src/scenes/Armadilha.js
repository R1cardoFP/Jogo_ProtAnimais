export default class Armadilha extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, frame = 0, key = 'trap') {
        super(scene, x, y, key, frame);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setOrigin(0.5, 1);

        // hitbox simples e estável
        if (this.body && this.body.setSize) {
            this.body.setSize(12, 8);
            this.body.setOffset(2, 8);
        }

        if (this.body && this.body.setImmovable) this.body.setImmovable(true);
        if (this.body) this.body.allowGravity = false;

        this.activated = false;
        this.setDepth(40);

        // START INVISIBLE: manter corpo activo para overlaps mas não desenhar
        this.setVisible(false);
    }

    // ativar armadilha: mostra, toca anim e no fim tira vida ao jogador
    trigger() {
        if (this.activated) return;
        this.activated = true;

        // mostrar a armadilha antes de tocar a animação (verificação defensiva)
        if (typeof this.setVisible === 'function') {
            this.setVisible(true);
        }
        if (typeof this.setAlpha === 'function') {
            this.setAlpha(1);
        }

        // tocar animação 'trap_anim' se existir
        if (this.scene && this.scene.anims && this.scene.anims.exists('trap_anim')) {
            this.play('trap_anim');
            // aguardar fim da animação e depois aplicar dano e destruir
            this.once('animationcomplete', (anim) => {
                if (anim && anim.key === 'trap_anim') {
                    if (this.scene && this.scene.player && typeof this.scene.player.takeDamage === 'function') {
                        this.scene.player.takeDamage(1);
                    }
                    if (this && typeof this.destroy === 'function') this.destroy();
                }
            });
        } else {
            // fallback: danos imediatos e destroy
            if (this.scene && this.scene.player && typeof this.scene.player.takeDamage === 'function') {
                this.scene.player.takeDamage(1);
            }
            if (this.scene && this.scene.time && typeof this.scene.time.delayedCall === 'function') {
                this.scene.time.delayedCall(400, () => {
                    if (this && typeof this.destroy === 'function') this.destroy();
                });
            } else {
                if (this && typeof this.destroy === 'function') this.destroy();
            }
        }
    }
}