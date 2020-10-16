import {Component, Prop, Vue} from "vue-property-decorator";
import {PacErrorModel} from "@/components/lib/pac-errors/pac-errors-model";

Component.registerHooks(['beforeRouteEnter', 'beforeRouteUpdate', 'beforeRouteLeave']);

@Component({name: 'common'})
export default class Common extends Vue {
    @Prop({type: Boolean, required: false, default: false})
    hideTop!: boolean;

    get url(): string {
        return this.$route.path;
    }

    focus(error: PacErrorModel, pre?: (error: PacErrorModel) => void) {
        if (pre !== undefined)
            pre(error);
        this.$nextTick(() => document.getElementById(error.id)?.focus());
    }
}
