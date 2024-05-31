<template>
    <div class="keypad">
        <div class="key top" :class="{ active: activeKey === 'ArrowUp' }">
            <div class="triangle up"></div>
        </div>
        <div class="key-row">
            <div class="key" :class="{ active: activeKey === 'ArrowLeft' }">
                <div class="triangle left"></div>
            </div>
            <div class="key" :class="{ active: activeKey === 'ArrowDown' }">
                <div class="triangle down"></div>
            </div>
            <div class="key" :class="{ active: activeKey === 'ArrowRight' }">
                <div class="triangle right"></div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'KeyPad',
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
        if (this.eventSource) {
            this.eventSource.close();
        }
    },
    methods: {
        sendInput() {
            // Your logic to send input to the backend here
            this.$emit('inputSent');
        },
        onKeyDown(event) {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                const key = event.key;
                this.activeKey = key;
                this.sendInput();
                fetch('http://localhost:5000/key_press', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ key })
                })
                    .then(response => response.json())
                    .then(data => {
                        console.log(data.feedback_count);
                        this.$emit('feedbackCountUpdated', data.feedback_count);
                    });
            }
        },
        onKeyUp() {
            this.activeKey = null;
        }
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
</style>