<template>
    <div ref='mask' class="pac-dialog">
        <div ref="panel">
            <div>
                <div @mousedown="startMove($event)" @mouseup="stopMove()">
                    <span>{{subject}}</span>
                </div>
                <div>
                    <img src="" alt="" @click="$emit('close')">
                </div>
            </div>
            <div>
                <slot/>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Prop, Vue} from "vue-property-decorator";
    import {ResizeObserver} from "@juggle/resize-observer";

    @Component({name: 'pac-dialog'})
    export default class PacDialog extends Vue {
        @Prop({type: String, required: true})
        subject!: string;

        resizeObserver = new ResizeObserver(() => this.align());

        mounted(): void {
            this.align();
            /** TODO the best way is to observe :
             *  location of mask
             *  location/size of body
             *  size of panel
             **/
            this.resizeObserver.observe(document.body);
        }

        align() {
            //align to mask
            const mask = this.$refs['mask'] as HTMLElement;
            const maskBoundingClientRect = mask.getBoundingClientRect();
            const panel = this.$refs['panel'] as HTMLElement;
            panel.style.left = `${maskBoundingClientRect.x}px`;
            panel.style.top = `${maskBoundingClientRect.y}px`;
            //if body-right exceeds, align to body-right
            const bodyBoundingClientRect = document.body.getBoundingClientRect();
            const panelBoundingClientRect = panel.getBoundingClientRect();
            if (panelBoundingClientRect.right > bodyBoundingClientRect.right)
                panel.style.left = `${panelBoundingClientRect.left - (panelBoundingClientRect.right - bodyBoundingClientRect.right)}px`;
            //if body-left exceeds, align to body-left
            if (panelBoundingClientRect.left < bodyBoundingClientRect.left)
                panel.style.left = `${panelBoundingClientRect.left + (bodyBoundingClientRect.left - panelBoundingClientRect.left)}px`;
            //if body-bottom exceeds, align to body-bottom
            if (panelBoundingClientRect.bottom > bodyBoundingClientRect.bottom)
                panel.style.top = `${panelBoundingClientRect.top - (panelBoundingClientRect.bottom - bodyBoundingClientRect.bottom)}px`;
            //if body-top exceeds, align to body-top
            if (panelBoundingClientRect.top < bodyBoundingClientRect.top)
                panel.style.top = `${panelBoundingClientRect.top + (bodyBoundingClientRect.top - panelBoundingClientRect.top)}px`;
        }

        startOffsetLeft: number | undefined;
        startOffsetTop: number | undefined;
        startClientX: number | undefined;
        startClientY: number | undefined;

        startMove(e: MouseEvent): void {
            const panel = this.$refs['panel'] as HTMLElement;
            this.startOffsetLeft = panel.offsetLeft;
            this.startOffsetTop = panel.offsetTop;
            this.startClientX = e.clientX;
            this.startClientY = e.clientY;
            window.addEventListener('mousemove', this.move);
        }

        move(e: MouseEvent): void {
            if (this.startOffsetLeft !== undefined && this.startOffsetTop !== undefined && this.startClientX !== undefined && this.startClientY !== undefined) {
                const panel = this.$refs['panel'] as HTMLElement;
                panel.style.left = `${this.startOffsetLeft + e.clientX - this.startClientX}px`;
                panel.style.top = `${this.startOffsetTop + e.clientY - this.startClientY}px`;
            }
        }

        stopMove(): void {
            this.startOffsetLeft = undefined;
            this.startOffsetTop = undefined;
            this.startClientX = undefined;
            this.startClientY = undefined;
            window.removeEventListener('mousemove', this.move);
        }
    }
</script>

<style lang="scss">
    @import "pac-dialog";
</style>