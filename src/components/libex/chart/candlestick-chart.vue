<template>
    <div ref="chart" style="min-width: 408px; height: 408px;"/>
</template>

<script lang="ts">
    import {Component, Prop, Vue, Watch} from "vue-property-decorator";
    import echarts from 'echarts'
    import {ResizeObserver} from "@juggle/resize-observer";
    import {avg, coalesce, elvis, round} from "@/components/lib/pac-common";
    import {dateToString} from "@/components/lib/pac-input/pac-input-common";
    import Format = echarts.EChartOption.Tooltip.Format;
    import DataZoom = echarts.EChartOption.DataZoom;


    @Component({name: 'candlestick-chart'})
    export default class CandlestickChart extends Vue {
        @Prop({type: String, required: true})
        text!: string;

        @Prop({type: String, required: true})
        subtext!: string;

        @Prop({type: Array, required: true})
        candlesticks!: Array<[Date, number, number, number, number, number, [number]]>;

        @Prop({type: Array, required: false, default: () => []})
        extraIndexNames!: Array<string>;

        @Prop({type: Array, required: false, default: () => []})
        extraIndexTypes!: Array<'line' | 'bar'>;

        @Prop({type: Number, required: true})
        selectedExtraIndex !: number;

        dateSeries: Array<string> = [];
        priceSeries: Array<[number, number, number, number]> = [];
        priceMA5Series: Array<number | undefined> = [];
        priceMA10Series: Array<number | undefined> = [];
        priceMA20Series: Array<number | undefined> = [];
        priceMA60Series: Array<number | undefined> = [];
        turnoverSeries: Array<number> = [];
        turnoverMA5Series: Array<number | undefined> = [];
        turnoverMA10Series: Array<number | undefined> = [];
        turnoverMA20Series: Array<number | undefined> = [];
        turnoverMA60Series: Array<number | undefined> = [];
        extraIndexSeries: Array<Array<number>> = [];
        currentSelectedExtraIndex = this.selectedExtraIndex;

        resizeObserver = new ResizeObserver(() => echarts.getInstanceByDom(this.$refs['chart'] as HTMLDivElement).resize());

        mounted(): void {
            const yang = (index: number) => this.priceSeries[index][1] > this.priceSeries[index][0];
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
                    height: 160,
                    show: true,
                    borderWidth: 1,
                    borderColor: '#f7f8f9'
                }, {
                    left: 60,
                    right: 116,
                    top: 248,
                    height: 64,
                    show: true,
                    borderWidth: 1,
                    borderColor: '#f7f8f9'
                }, {
                    left: 60,
                    right: 116,
                    top: 336,
                    height: 64,
                    show: true,
                    borderWidth: 1,
                    borderColor: '#f7f8f9'
                }],
                legend: {
                    orient: 'vertical',
                    top: 64,
                    left: 'right',
                    selectedMode: 'single',
                    data: this.extraIndexNames,
                    selected: Object.assign({}, ...this.extraIndexNames.map((value, index) => eval(`Object({${value}:${index === this.currentSelectedExtraIndex}})`)))
                },
                axisPointer: {
                    link: [{
                        xAxisIndex: [0, 1, 2]
                    }],
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
                    xAxisIndex: [0, 1, 2],
                    startValue: 1,
                    endValue: this.dateSeries.length - 1,
                }],
                tooltip: {
                    show: true,
                    trigger: 'axis',
                    transitionDuration: 0,
                    position: [64, 0],
                    extraCssText: 'width: 344px; height: 52px; text-align: left;',
                    axisPointer: {
                        type: 'cross'
                    },
                    backgroundColor: '#00000000',
                    formatter: (params: Format | Format[]) => {
                        params = params as Format[];
                        const index = params[0].dataIndex as number;
                        const open = round(this.priceSeries[index][0], 2);
                        const low = round(this.priceSeries[index][2], 2);
                        const high = round(this.priceSeries[index][3], 2);
                        const close = round(this.priceSeries[index][1], 2);
                        const turnover = round(this.turnoverSeries[index], 2);
                        const ref = index > 0 ? round(this.priceSeries[index - 1][1], 2) : round(this.priceSeries[index][0], 2);
                        let html = '';
                        html += `<span style="font-family: 'Microsoft YaHei UI', serif; font-size: 12px; color: #333333;">开</span>&nbsp;<span style="font-family: 'Courier New', serif; font-size: 12px; color: ${open > ref ? '#f11200' : open < ref ? '#00a800' : '#333333'};">${open.toFixed(2)}</span>&nbsp;&nbsp;&nbsp;`;
                        html += `<span style="font-family: 'Microsoft YaHei UI', serif; font-size: 12px; color: #333333;">低</span>&nbsp;<span style="font-family: 'Courier New', serif; font-size: 12px; color: ${low > ref ? '#f11200' : low < ref ? '#00a800' : '#333333'};">${low.toFixed(2)}</span>>&nbsp;&nbsp;&nbsp;`;
                        html += `<span style="font-family: 'Microsoft YaHei UI', serif; font-size: 12px; color: #333333;">高</span>&nbsp;<span style="font-family: 'Courier New', serif; font-size: 12px; color: ${high > ref ? '#f11200' : high < ref ? '#00a800' : '#333333'};">${high.toFixed(2)}</span>>&nbsp;&nbsp;&nbsp;`;
                        html += `<span style="font-family: 'Microsoft YaHei UI', serif; font-size: 12px; color: #333333;">收</span>&nbsp;<span style="font-family: 'Courier New', serif; font-size: 12px; color: ${close > ref ? '#f11200' : close < ref ? '#00a800' : '#333333'};">${close.toFixed(2)}</span>&nbsp;&nbsp;&nbsp;`;
                        html += `<span style="font-family: 'Microsoft YaHei UI', serif; font-size: 12px; color: #333333;">换手</span>&nbsp;<span style="font-family: 'Courier New', serif; font-size: 12px; color: ${close > ref ? '#f11200' : close < ref ? '#00a800' : '#333333'};">${turnover.toFixed(2)}</span>`;
                        html += '<br/>';
                        html += `<span style="font-family: 'Microsoft YaHei UI', serif; font-size: 12px; color: #333333;">${this.extraIndexNames[this.currentSelectedExtraIndex]}</span>&nbsp;<span style="font-family: 'Courier New', serif; font-size: 12px; color: ${close > ref ? '#f11200' : close < ref ? '#00a800' : '#333333'};">${this.formatNumber(this.extraIndexSeries[this.currentSelectedExtraIndex][index], 2)}</span>`;
                        return html;
                    }
                },
                xAxis: [{
                    gridIndex: 0,
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
                }, {
                    gridIndex: 1,
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
                            show: false
                        }
                    },
                    data: this.dateSeries
                }, {
                    gridIndex: 2,
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
                            show: false
                        }
                    },
                    data: this.dateSeries
                }],
                yAxis: [{
                    gridIndex: 0,
                    type: 'value',
                    scale: true,
                    splitNumber: 4,
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
                }, {
                    gridIndex: 1,
                    type: 'value',
                    scale: false,
                    splitNumber: 2,
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
                }, {
                    gridIndex: 2,
                    type: 'value',
                    scale: false,
                    splitNumber: 2,
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
                series: [{
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    name: '日线',
                    type: 'candlestick',
                    barWidth: '50%',
                    itemStyle: {
                        normal: {
                            color: '#f11200',
                            borderColor: '#f11200',
                            color0: '#00a800',
                            borderColor0: '#00a800'
                        }
                    },
                    data: this.priceSeries
                }, {
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    name: 'MA5',
                    type: 'line',
                    showSymbol: false,
                    lineStyle: {
                        width: 1
                    },
                    data: this.priceMA5Series
                }, {
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    name: 'MA10',
                    type: 'line',
                    showSymbol: false,
                    lineStyle: {
                        width: 1
                    },
                    data: this.priceMA10Series
                }, {
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    name: 'MA20',
                    type: 'line',
                    showSymbol: false,
                    lineStyle: {
                        width: 1
                    },
                    data: this.priceMA20Series
                }, {
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    name: 'MA60',
                    type: 'line',
                    showSymbol: false,
                    lineStyle: {
                        width: 1
                    },
                    data: this.priceMA60Series
                }, {
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    name: '换手率',
                    type: 'bar',
                    barWidth: '50%',
                    itemStyle: {
                        color: (params: { dataIndex: number }) => yang(params.dataIndex) ? '#f11200' : '#00a800'
                    },
                    data: this.turnoverSeries
                }, {
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    name: 'MA5',
                    type: 'line',
                    showSymbol: false,
                    lineStyle: {
                        width: 1
                    },
                    data: this.turnoverMA5Series
                }, {
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    name: 'MA10',
                    type: 'line',
                    showSymbol: false,
                    lineStyle: {
                        width: 1
                    },
                    data: this.turnoverMA10Series
                }, {
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    name: 'MA20',
                    type: 'line',
                    showSymbol: false,
                    lineStyle: {
                        width: 1
                    },
                    data: this.turnoverMA20Series
                }, {
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    name: 'MA60',
                    type: 'line',
                    showSymbol: false,
                    lineStyle: {
                        width: 1
                    },
                    data: this.turnoverMA60Series
                }, ...this.extraIndexSeries.map((item, index) => ({
                    xAxisIndex: 2,
                    yAxisIndex: 2,
                    name: this.extraIndexNames[index],
                    type: this.extraIndexTypes[index],
                    // showSymbol: false,
                    // lineStyle: {
                    //     width: 1
                    // },
                    data: item
                }))]
            });
            echart.on('legendselectchanged', (params: { name: string; selected: Record<string, boolean> }) =>
                this.currentSelectedExtraIndex = this.extraIndexNames.indexOf(params.name));
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

        @Watch('extraIndexNames', {immediate: true})
        onExtraIndexNamesChange(): void {
            //do not update series name on chart, since normally the names are pass at the first time, and if you do update after hand, you have to set options and reset all the series data again which is to heavy.
        }

        @Watch('extraIndexTypes', {immediate: true})
        onExtraIndexTypesChange(): void {
            //do not update series name on chart, since normally the names are pass at the first time, and if you do update after hand, you have to set options and reset all the series data again which is to heavy.
        }

        @Watch('candlesticks', {immediate: true})
        onCandlesticksChange(newVal: Array<[Date, number, number, number, number, number, [number]]>, oldVal: Array<[Date, number, number, number, number, number, [number]]>): void {
            this.dateSeries = this.candlesticks.map(item =>
                dateToString(item[0]));
            this.priceSeries = this.candlesticks.map(item => [
                item[1],
                item[2],
                item[3],
                item[4],
            ]);
            this.priceMA5Series = this.priceSeries.map((value, index, array) => avg(array.slice(Math.max(index - 4, 0), index + 1).map(it => it[1])));
            this.priceMA10Series = this.priceSeries.map((value, index, array) => avg(array.slice(Math.max(index - 9, 0), index + 1).map(it => it[1])));
            this.priceMA20Series = this.priceSeries.map((value, index, array) => avg(array.slice(Math.max(index - 19, 0), index + 1).map(it => it[1])));
            this.priceMA60Series = this.priceSeries.map((value, index, array) => avg(array.slice(Math.max(index - 59, 0), index + 1).map(it => it[1])));
            this.turnoverSeries = this.candlesticks.map(item =>
                item[5]);
            this.turnoverMA5Series = this.turnoverSeries.map((value, index, array) => avg(array.slice(Math.max(index - 4, 0), index + 1)));
            this.turnoverMA10Series = this.turnoverSeries.map((value, index, array) => avg(array.slice(Math.max(index - 9, 0), index + 1)));
            this.turnoverMA20Series = this.turnoverSeries.map((value, index, array) => avg(array.slice(Math.max(index - 19, 0), index + 1)));
            this.turnoverMA60Series = this.turnoverSeries.map((value, index, array) => avg(array.slice(Math.max(index - 59, 0), index + 1)));
            this.extraIndexSeries = this.extraIndexNames.map((value, index) => this.candlesticks.map(it => it[6][index]));
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
                    }, {
                        data: this.dateSeries
                    }, {
                        data: this.dateSeries
                    }],
                    series: [{
                        data: this.priceSeries
                    }, {
                        data: this.priceMA5Series
                    }, {
                        data: this.priceMA10Series
                    }, {
                        data: this.priceMA20Series
                    }, {
                        data: this.priceMA60Series
                    }, {
                        data: this.turnoverSeries
                    }, {
                        data: this.turnoverMA5Series
                    }, {
                        data: this.turnoverMA10Series
                    }, {
                        data: this.turnoverMA20Series
                    }, {
                        data: this.turnoverMA60Series
                    }, ...this.extraIndexSeries.map(item => ({
                        data: item
                    }))]
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