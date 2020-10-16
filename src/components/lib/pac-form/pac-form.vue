<template>
    <div class="pac-form">
        <div :class="{hidden:hideTop}">
            <div>
                <span style="margin-left: 16px;">{{name}}</span>
            </div>
            <div>
                <div v-show="progressModel.items.length > 0" style="margin-right: 6px;"/>
                <img src="" alt="" style="margin-right: 6px;" @click="urlShown = !urlShown"/>
                <pac-dialog subject="地址" v-if="urlShown" @close="urlShown = false">
                    <div class="url-row">
                        <pac-input-string :label="null" :required="false" :disabled="true"
                                          :password="false" :length="2048" nullOrBlank="blank"
                                          :value="baseUrl + url" :validate="async () => null"/>
                        <pac-button style="margin-left: 8px;" text="复制" @input="copy()"/>
                    </div>
                </pac-dialog>
                <img src="" alt="" style="margin-right: 6px;" v-if="hasPrevious"
                     @click="$router.back()"/>
            </div>
        </div>
        <div v-if="loading" class="loading">
            <img src="" alt=""/>
            <span>Loading</span>
        </div>
        <div v-else>
            <slot/>
        </div>
    </div>
</template>

<script lang="ts">
    import {Component, Prop, Vue} from "vue-property-decorator";
    import {HTML_BASE_URL} from "@/components/gen/common";
    import {PacProgressModel} from "@/components/lib/pac-form/pac-form-model";
    import {writeText} from "clipboard-polyfill";

    @Component({name: 'pac-form'})
    export default class PacForm extends Vue {
        @Prop({type: Boolean, required: false, default: false})
        hideTop!: boolean;

        @Prop({type: String, required: true})
        name!: string;

        @Prop({type: String, required: true})
        url!: string;

        @Prop({type: Boolean, required: true})
        loading!: boolean;

        @Prop({type: Object, required: true})
        progressModel!: PacProgressModel;

        baseUrl = HTML_BASE_URL;

        get hasPrevious(): boolean {
            return window.history.length > 0;
        }

        urlShown = false;

        copy(): void {
            writeText(this.baseUrl + this.url);
        }
    }
</script>

<style lang="scss">
    @import "pac-form";
</style>