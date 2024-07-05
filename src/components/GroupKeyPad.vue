<template>
    <div class="keypad">
        <div class="key top" :class="{ active: activeKey === 'ArrowUp' }" @click="onKeyClick('ArrowUp')" title="Equal">
            <div class="triangle up"></div>
        </div>
        <div class="key-row">
            <div class="key" :class="{ active: activeKey === 'ArrowLeft' }" @click="onKeyClick('ArrowLeft')" title="Left">
                <div class="triangle left"></div>
            </div>
            <div class="key placeholder"></div>
            <div class="key" :class="{ active: activeKey === 'ArrowRight' }" @click="onKeyClick('ArrowRight')" title="Right">
                <div class="triangle right"></div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'GroupKeyPad',
    props: {
        isInputAllowed: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
            activeKey: null
        }
    },
    mounted() {
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    },
    beforeUnmount() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
    },
    methods: {
        onKeyDown(event) {
            if (!this.isInputAllowed) {
                return;
            }
            if (['ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                this.activeKey = event.key;
                this.$emit('keyPressed', this.activeKey);
            }
        },
        onKeyUp() {
            this.activeKey = null;
        },
        onKeyClick(key) {
            if (!this.isInputAllowed) {
                return;
            }
            if (['ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(key)) {
                this.activeKey = key;
                this.$emit('keyPressed', this.activeKey);
                setTimeout(() => {
                    this.activeKey = null;
                }, 250);
            }
        },
    }
}
</script>

<style scoped>
.keypad {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.key-row {
    display: flex;
    justify-content: space-between;
}

.key {
    width: 50px;
    height: 50px;
    background: black;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 10px;
}

.triangle {
    width: 0;
    height: 0;
    border-style: solid;
}

.up {
    border-width: 0 10px 20px 10px;
    border-color: transparent transparent white transparent;
}

.down {
    border-width: 20px 10px 0 10px;
    border-color: white transparent transparent transparent;
}

.left {
    border-width: 10px 20px 10px 0;
    border-color: transparent white transparent transparent;
}

.right {
    border-width: 10px 0 10px 20px;
    border-color: transparent transparent transparent white;
}

.key.active {
    transform: scale(1.1);
    background: grey;
}

.key.placeholder {
    background: transparent;
}
</style>