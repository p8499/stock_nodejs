<template>
    <pac-form :hideTop="hideTop" name="分析" :url="url" :loading="loading" :progressModel="progressModel">
        <pac-errors style="width: 100%; margin-bottom: 14px;"
                    :value="errorsModel" @input:focus="focus($event, focusTab)"/>
        <pac-tab style="width: 100%;" :tabs="tabs"
                 :selectedTab="selectedTab" @input:selectedTab="selectedTab = $event">
            <template v-slot:0>
                <candlestick-chart style="width: 100%;" :text="stock.stname" :subtext="stock.stcode"
                                   :candlesticks="stockDay1List.map(item => [item.d1date,item.d1openpre, item.d1closepre, item.d1lowpre, item.d1highpre, item.d1turnover * 100, [item.d1fina, item.d1fioiy, item.d1finpey, item.d1fiocny, item.d1finaps, item.d1fioiyps, item.d1finpeyps, item.d1fiocnyps, item.d1pb, item.d1ps, item.d1pe, item.d1pcf, item.d1netpercent4, item.d1netforce4]])"
                                   :extraIndexNames="['净资产','营业收入','净利润','经营现金','每股净资产','每股营业收入','每股净利润','每股经营现金','市净率','市销率','市盈率','市现率','超大单占比', '超大单力度']"
                                   :extraIndexTypes="['line','line','line','line','line','line','line','line','line','line','line','line','bar','bar']"
                                   :selectedExtraIndex="12"
                                   @query="queryStockDay1()"/>
            </template>
            <template v-slot:1>
                <finance-chart style="width: 100%;" :text="stock.stname" :subtext="stock.stcode"
                               :indexes="financeList.map(item => [`${item.fiyear}Q${item.fiperiod}`, [item.fina, item.fioi, item.finpe, item.fiocn, item.fioiy, item.finpey, item.fiocny]])"
                               :indexNames="['净资产', '营业收入', '净利润', '经营现金', '年化营业收入', '年化净利润', '年化经营现金']"
                               :selectedIndex="[0, 4, 5]"
                               @query="queryFinance()"/>
            </template>
            <template v-slot:2>
                <pac-table style="margin-top: 14px; max-width: 100%; max-height: 480px;"
                           :model="messageTableModel" :list="messageList" :contentRange="messageContentRange"
                           :pageSize="messagePageSize" @input:pageSize="messagePageSize = $event"
                           @input:pageNumber="messagePageNumber = $event"
                           :filterItemsModel="messageFilterItemsModel"
                           :sortModel="messageSortModel" @input:sortModel="messageSortModel = $event"
                           :selection="messageSelection" @input:selection="messageSelection = $event"
                           @refresh="queryMessage()">
                    <template v-slot:msstid="data">{{data.element.msstid}}</template>
                    <template v-slot:mspublish="data">
                        {{data.element.mspublish === null? '' : dateToString(data.element.mspublish)}}
                    </template>
                    <template v-slot:msyear="data">{{data.element.msyear}}</template>
                    <template v-slot:msperiod="data">{{data.element.msperiod}}</template>
                    <template v-slot:msseq="data">{{data.element.msseq}}</template>
                    <template v-slot:mssubject="data">{{data.element.mssubject}}</template>
                    <template v-slot:mscontent="data">{{data.element.mscontent}}</template>
                </pac-table>
            </template>
        </pac-tab>
    </pac-form>
</template>

<script lang="ts">
    import {Component, Prop} from "vue-property-decorator";
    import {PacProgressModel} from "@/components/lib/pac-form/pac-form-model";
    import {PacErrorModel, PacErrorObj, PacErrorsModel} from "@/components/lib/pac-errors/pac-errors-model";
    import Common from "@/common";
    import {STOCKDAY1_SPEC} from "@/components/gen/spec/StockDay1Spec";
    import {StockDay1} from "@/components/gen/bean/StockDay1";
    import {FINANCE_SPEC} from "@/components/gen/spec/FinanceSpec";
    import {Finance} from "@/components/gen/bean/Finance";
    import {queryStockDay1} from "@/components/gen/stub/StockDay1Stub";
    import {FilterLogicExpr} from "@/components/gen/filter";
    import {OrderByExpr, OrderByListExpr} from "@/components/gen/order";
    import {ContentRange} from "@/components/gen/range";
    import {queryFinance} from "@/components/gen/stub/FinanceStub";
    import {dateToString} from "@/components/lib/pac-input/pac-input-common";
    import {MESSAGE_SPEC} from "@/components/gen/spec/MessageSpec";
    import {PacTableFieldModel, PacTableModel} from "@/components/lib/pac-table/pac-table-model";
    import {FilterItemsModel} from "@/components/lib/pac-table/filter-items-model";
    import {SortModel} from "@/components/lib/pac-table/sort-model";
    import {Message} from "@/components/gen/bean/Message";
    import {queryMessage} from "@/components/gen/stub/MessageStub";
    import {Stock} from "@/components/gen/bean/Stock";
    import {getStock} from "@/components/gen/stub/StockStub";

    @Component({name: 'stock-inspect'})
    export default class StockInspect extends Common {
        loading = true;
        progressModel = new PacProgressModel();
        errorsModel = new PacErrorsModel();
        tabs: Array<string> = ['走势', '财报', '消息'];
        selectedTab = 0;
        dateToString = dateToString;

        @Prop({type: String, required: true})
        initStid!: string;
        stid = this.initStid;
        stock = new Stock();

        stockDay1Spec = STOCKDAY1_SPEC;
        stockDay1PageSize = 520;
        stockDay1List = new Array<StockDay1>();
        stockDay1PageNumber = 0;
        stockDay1End = false;

        financeSpec = FINANCE_SPEC;
        financePageSize = 60;
        financeList = new Array<Finance>();
        financePageNumber = 0;
        financeEnd = false;

        messageSpec = MESSAGE_SPEC;
        messageTableModel = new PacTableModel('multiple').appendField(
            new PacTableFieldModel(this.messageSpec.fields.msstid.alias.toLowerCase(), this.messageSpec.fields.msstid.description, 100, true, true),
            new PacTableFieldModel(this.messageSpec.fields.mspublish.alias.toLowerCase(), this.messageSpec.fields.mspublish.description, 120, true, true),
            new PacTableFieldModel(this.messageSpec.fields.msyear.alias.toLowerCase(), this.messageSpec.fields.msyear.description, 100, true, true),
            new PacTableFieldModel(this.messageSpec.fields.msperiod.alias.toLowerCase(), this.messageSpec.fields.msperiod.description, 100, true, true),
            new PacTableFieldModel(this.messageSpec.fields.msseq.alias.toLowerCase(), this.messageSpec.fields.msseq.description, 100, true, true),
            new PacTableFieldModel(this.messageSpec.fields.mssubject.alias.toLowerCase(), this.messageSpec.fields.mssubject.description, 240, true, true),
            new PacTableFieldModel(this.messageSpec.fields.mscontent.alias.toLowerCase(), this.messageSpec.fields.mscontent.description, 3600, true, true));
        messagePageSize = 50;
        messagePageNumber = 1;
        messageFilterItemsModel = new FilterItemsModel(this.messageSpec);
        messageSortModel: SortModel | null = new SortModel(this.messageSpec.fields.mspublish.alias.toLowerCase(), 'descending');
        messageList = new Array<Message>();
        messageSelection = new Array<Message>();
        messageContentRange = new ContentRange();

        async created(): Promise<void> {
            await this.get();
            await this.queryStockDay1();
            await this.queryFinance();
            await this.queryMessage();
            this.loading = false;
        }

        async get(): Promise<void> {
            const progress = this.progressModel.start();
            try {
                const {stock} = await getStock({stid: this.stid});
                this.stock = stock;
            } catch (e) {
                this.errorsModel.set(new PacErrorObj('get', {
                    subject: '远程服务器错误',
                    content: `远程服务器状态：${e.statusCode}`
                }));
            } finally {
                this.progressModel.stop(progress);
            }
        }

        async queryStockDay1(): Promise<void> {
            if (!this.stockDay1End) {
                const progress = this.progressModel.start();
                try {
                    const {list, contentRange} = await queryStockDay1({
                        filter: new FilterLogicExpr().equalsString(this.stockDay1Spec.fields.d1stid.alias.toLowerCase(), this.stid),
                        orderBy: new OrderByExpr(this.stockDay1Spec.fields.d1date.alias.toLowerCase(), false).only(),
                        pageSize: this.stockDay1PageSize,
                        pageNumber: ++this.stockDay1PageNumber
                    });
                    this.stockDay1List = [...list.reverse(), ...this.stockDay1List];
                    this.stockDay1End = contentRange.end >= contentRange.total - 1;
                } catch (e) {
                    this.errorsModel.set(new PacErrorObj('queryStockDay1', {
                        subject: '远程服务器错误',
                        content: `远程服务器状态：${e.statusCode}`
                    }));
                } finally {
                    this.progressModel.stop(progress);
                }
            }
        }

        async queryFinance(): Promise<void> {
            if (!this.financeEnd) {
                const progress = this.progressModel.start();
                try {
                    const {list, contentRange} = await queryFinance({
                        filter: new FilterLogicExpr().equalsString(this.financeSpec.fields.fistid.alias.toLowerCase(), this.stid),
                        orderBy: new OrderByListExpr().append(new OrderByExpr(this.financeSpec.fields.fiyear.alias.toLowerCase(), false), new OrderByExpr(this.financeSpec.fields.fiperiod.alias.toLowerCase(), false)),
                        pageSize: this.financePageSize,
                        pageNumber: ++this.financePageNumber
                    });
                    this.financeList = [...list.reverse(), ...this.financeList];
                    this.financeEnd = contentRange.end >= contentRange.total - 1;
                } catch (e) {
                    this.errorsModel.set(new PacErrorObj('queryFinance', {
                        subject: '远程服务器错误',
                        content: `远程服务器状态：${e.statusCode}`
                    }));
                } finally {
                    this.progressModel.stop(progress);
                }
            }
        }

        async queryMessage(): Promise<void> {
            const progress = this.progressModel.start();
            try {
                const {list, contentRange} = await queryMessage({
                    filter: this.messageFilterItemsModel.expr !== undefined ?
                        this.messageFilterItemsModel.expr.equalsString(this.messageSpec.fields.msstid.alias, this.stid) :
                        new FilterLogicExpr().equalsString(this.messageSpec.fields.msstid.alias, this.stid),
                    orderBy: this.messageSortModel?.expr?.only(),
                    pageSize: this.messagePageSize,
                    pageNumber: this.messagePageNumber
                });
                this.messageList = list;
                this.messageContentRange = contentRange;
            } catch (e) {
                this.errorsModel.set(new PacErrorObj('queryMessage', {
                    subject: '远程服务器错误',
                    content: `远程服务器状态：${e.statusCode}`
                }));
            } finally {
                this.progressModel.stop(progress);
            }
        }

        focusTab(error: PacErrorModel) {
            if (error.paths.length > 0)
                this.selectedTab = parseInt(error.paths[0]);
        }
    }
</script>

<style lang="scss" scoped>
</style>