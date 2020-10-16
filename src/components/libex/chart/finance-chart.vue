import echarts from "echarts";
import echarts from "echarts";
<template>
    <div ref="chart" style="min-width: 408px; height: 408px;"/>
</template>

<script lang="ts">
    import {Component, Prop, Vue, Watch} from "vue-property-decorator";
    import echarts from 'echarts'
    import {ResizeObserver} from "@juggle/resize-observer";
    import {coalesce, elvis} from "@/components/lib/pac-common";
    import DataZoom = echarts.EChartOption.DataZoom;
    import Format = echarts.EChartOption.Tooltip.Format;

    @Component({name: 'finance-chart'})
    export default class FinanceChart extends Vue {
        @Prop({type: String, required: true})
        text!: string;

        @Prop({type: String, required: true})
        subtext!: string;

        @Prop({type: Array, required: true})
        indexes!: Array<[string, Array<number>]>;

        @Prop({type: Array, required: true})
        indexNames!: Array<string>;

        @Prop({type: Array, required: true})
        selectedIndex !: Array<number>;

        dateSeries: Array<string> = [];
        indexSeries: Array<Array<number>> = [];
        currentSelectedIndex = this.selectedIndex;

        resizeObserver = new ResizeObserver(() => echarts.getInstanceByDom(this.$refs['chart'] as HTMLDivElement).resize());

        mounted(): void {
            const chart = this.$refs['chart'] as HTMLDivElement;
            this.resizeObserver.observe(chart);
            const echart = echarts.init(chart);
            echart.setOption({
                title: {
                    text: this.text,
                    textStyle: {
                        fontSize: 12,
                        color: '#333333'
                    },
                    subtext: this.subtext,
                    subtextStyle: {
                        fontSize: 11,
                        color: '#666666'
                    },
                },
                grid: [{
                    left: 60,
                    right: 116,
                    top: 64,
                    height: 336,
                    show: true,
                    borderWidth: 1,
                    borderColor: '#f7f8f9'
                }],
                legend: {
                    orient: 'vertical',
                    top: 64,
                    right: 'right',
                    selectedMode: 'multiple',
                    data: this.indexNames,
                    selected: Object.assign({}, ...this.indexNames.map((value, index) => eval(`Object({${value}:${this.currentSelectedIndex.includes(index)}})`)))
                },
                axisPointer: {
                    label: {
                        fontFamily: 'Arial',
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: '#333333',
                        borderColor: '#333333',
                        borderWidth: 1,
                        backgroundColor: '#ffffff',
                        shadowBlur: 0
                    }
                },
                dataZoom: [{
                    type: 'inside',
                    startValue: 1,
                    endValue: this.dateSeries.length - 1,
                }],
                tooltip: {
                    show: true,
                    trigger: 'item',
                    transitionDuration: 0,
                    axisPointer: {
                        type: 'cross'
                    },
                    backgroundColor: '#fafafacc',
                    borderColor: '#ccc',
                    borderWidth: 1
                },
                xAxis: [{
                    type: 'category',
                    axisLine: {
                        show: false
                    },
                    axisTick: {
                        show: false
                    },
                    axisLabel: {
                        show: false
                    },
                    axisPointer: {
                        label: {
                            show: true
                        }
                    },
                    data: this.dateSeries
                }],
                yAxis: [{
                    type: 'value',
                    scale: false,
                    splitNumber: 10,
                    axisLine: {
                        show: false
                    },
                    axisTick: {
                        show: false
                    },
                    axisLabel: {
                        inside: false,
                        fontFamily: 'Arial',
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: '#888888',
                        formatter: (value: number) => this.formatNumber(value, 2)
                    },
                    axisPointer: {
                        label: {
                            show: true,
                            formatter: (params: { value: number }) => this.formatNumber(params.value, 2)
                        }
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#f7f8f9',
                            type: 'dotted'
                        }
                    },
                }],
                series: this.indexSeries.map((item, index) => ({
                    name: this.indexNames[index],
                    type: 'bar',
                    tooltip: {
                        formatter: (params: Format | Format[]) => {
                            params = params as Format;
                            return `<span style="font-family: 'Microsoft YaHei UI', serif; font-size: 12px; color: #333333;">${params.seriesName}</span>&nbsp;<span style="font-family: 'Courier New', serif; font-size: 12px; color: #333333;">${typeof (params.value) === 'number' ? this.formatNumber(params.value, 2) : '未知'}</span>`;
                        }
                    },
                    data: item
                }))
            });
            echart.on('legendselectchanged', (params: { name: string; selected: Record<string, boolean> }) => {
                const index = this.indexNames.indexOf(params.name);
                if (params.selected[name] && !this.currentSelectedIndex.includes(index))
                    this.currentSelectedIndex.push(index);
                else if (!params.selected[name] && this.currentSelectedIndex.includes(index))
                    this.currentSelectedIndex.splice(this.currentSelectedIndex.indexOf(index), 1);
            });
            echart.on('datazoom', (params: { batch: Array<{ start: number; end: number }> }) => {
                if (params.batch[0].start === 0)
                    this.$emit('query');
            });
        }

        @Watch('text', {immediate: true})
        onTextChange(): void {
            elvis(this.$refs['chart'] as HTMLDivElement, it =>
                echarts.getInstanceByDom(it)?.setOption({
                    title: {
                        text: this.text
                    }
                }));
        }

        @Watch('subtext', {immediate: true})
        onSubtextChange(): void {
            elvis(this.$refs['chart'] as HTMLDivElement, it =>
                echarts.getInstanceByDom(it)?.setOption({
                    title: {
                        subtext: this.subtext
                    }
                }));
        }

        @Watch('indexNames', {immediate: true})
        onIndexNamesChange(): void {
            //do not update series name on chart, since normally the names are pass at the first time, and if you do update after hand, you have to set options and reset all the series data again which is to heavy.
        }

        @Watch('indexes', {immediate: true})
        onIndexesChange(newVal: Array<[Date, Array<number>]>, oldVal: Array<[Date, Array<number>]>): void {
            this.dateSeries = this.indexes.map(item =>
                item[0]);
            this.indexSeries = this.indexNames.map((value, index) => this.indexes.map(it => it[1][index]));
            elvis(this.$refs['chart'] as HTMLDivElement, it => {
                const echart = echarts.getInstanceByDom(it);
                const oldDataZoom = elvis(echart.getOption().dataZoom, dz => dz[0]) as DataZoom;
                echart.setOption({
                    dataZoom: [{
                        //if it's the first time, set range [1 to end]
                        //otherwise, range = old range + offset, offset = new data added = new length - old length
                        startValue: oldVal.length === 0 ? 1 : coalesce(oldDataZoom.startValue, 0) + newVal.length - oldVal.length,
                        endValue: oldVal.length === 0 ? this.dateSeries.length - 1 : coalesce(oldDataZoom.endValue, 0) + newVal.length - oldVal.length
                    }],
                    xAxis: [{
                        data: this.dateSeries
                    }],
                    series: this.indexSeries.map(item => ({
                        data: item
                    }))
                }, false, true);
            });
        }

        destroyed(): void {
            const chart = this.$refs['chart'] as HTMLDivElement;
            this.resizeObserver.unobserve(chart);
        }

        formatNumber(value: number, fraction: number): string {
            if (Math.abs(value) >= 100000000000000000000)
                return `${(value / 100000000000000000000).toFixed(fraction)} 垓`;
            else if (Math.abs(value) >= 10000000000000000)
                return `${(value / 10000000000000000).toFixed(fraction)} 京`;
            else if (Math.abs(value) >= 1000000000000)
                return `${(value / 1000000000000).toFixed(fraction)} 兆`;
            else if (Math.abs(value) >= 100000000)
                return `${(value / 100000000).toFixed(fraction)} 亿`;
            else if (Math.abs(value) >= 10000)
                return `${(value / 10000).toFixed(fraction)} 万`;
            else if (Math.abs(value) >= 1 || value === 0)
                return value.toFixed(fraction);
            else if (Math.abs(value) >= 0.0001)
                return `${(value * 10000).toFixed(fraction)} 丝`;
            else
                return `${(value * 100000000).toFixed(fraction)} 沙`;
        }
    }
</script>

<style scoped>

</style>