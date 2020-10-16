<template>
    <div ref='mask' class="pac-table-filter">
        <div ref="panel">
            <div class="title" :style="{'display': field !== undefined? 'flex' : 'none'}">
                <div @mousedown="startMove($event)" @mouseup="stopMove()">
                    <span>{{field !==undefined? value.spec.fields[field].description : ''}} 过滤条件</span>
                </div>
                <div>
                    <img src="" alt="" @click="$emit('close')"/>
                </div>
            </div>
            <div class="items" v-if="indexedElements.length > 0" style="margin-top: 6px; margin-bottom: 4px;">
                <div v-for="(v, i) in indexedElements" :key="v.id"
                     :style="{'margin-top': i === 0? '0' : '4px'}">
                    <img src="" alt="" style="margin-right: 4px;"
                         @click="value.remove(v.id)"/>
                    <pac-table-filter-item
                            :value="v.item" @input="value.set(v.id, $event)"
                            :operand1Fixed="field !== undefined"/>
                </div>
            </div>
            <div class="add" style="margin-top: 6px;">
                <img src="" alt="" @click="add()"/>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Prop, Vue} from "vue-property-decorator";
    import {FilterItemsModel} from "@/components/lib/pac-table/filter-items-model";
    import {FilterItemModel} from "@/components/lib/pac-table/filter-item-model";

    @Component({name: 'pac-table-filter'})
    export default class PacTableFilter<T> extends Vue {
        @Prop({type: Object, required: true})
        value!: FilterItemsModel;

        @Prop({type: String, required: false})
        field?: string;

        get indexedElements(): Array<{ id: number; item: FilterItemModel }> {
            if (this.field !== undefined)
                return this.value.indexedElements.filter(v => v.item.operand1 === this.field);
            else
                return this.value.indexedElements;
        }

        add(): void {
            this.value.add(new FilterItemModel(this.value.spec, this.field));
        }

        intersectionObserver = new IntersectionObserver(() => this.align());

        mounted(): void {
            this.align();
            this.intersectionObserver.observe(this.$refs['panel'] as HTMLElement);
        }

        beforeDestroy(): void {
            this.intersectionObserver.unobserve(this.$refs['panel'] as HTMLElement);
            this.intersectionObserver.disconnect();
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
    @import "pac-table";
</style>