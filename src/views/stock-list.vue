<template>
    <pac-form name="股票" :url="url" :loading="loading" :progressModel="progressModel">
        <pac-errors style="width: 100%; margin-bottom: 14px;"
                    :value="errorsModel" @input:focus="focus($event)"/>
        <pac-table style="margin-top: 14px; max-width: 100%; max-height: 480px;"
                   :model="tableModel" :list="list" :contentRange="contentRange"
                   :pageSize="pageSize" @input:pageSize="pageSize = $event"
                   @input:pageNumber="pageNumber = $event"
                   :filterItemsModel="filterItemsModel"
                   :sortModel="sortModel" @input:sortModel="sortModel = $event"
                   :selection="selection" @input:selection="selection = $event"
                   @refresh="query()">
            <template v-slot:stid="data">
                <router-link :to="{path: `/stock-inspect/${data.element.stid}`}">
                    {{data.element.stid}}
                </router-link>
                <img class="preview" src="" alt="" style="margin-left: 8px;"
                     @click="!previewList.includes(data.element.stid)?previewList.push(data.element.stid):undefined"/>
                <img class="message" src="" alt=""/>
                <img :class="data.element.stfavorite === 1? 'favorite' : 'non-favorite'"
                     src="" alt="" style="margin-left: 8px;"
                     @click="data.element.stfavorite === 1? deleteFavorite(data.element) : addFavorite(data.element)"/>
                <pac-dialog subject="分析" v-if="previewList.includes(data.element.stid)"
                            @close="previewList.splice(previewList.indexOf(data.element.stid), 1)">
                    <stock-inspect style="width: 840px; height: 560px;"
                                   :hide-top="true" :init-stid="data.element.stid"/>
                </pac-dialog>
            </template>
            <template v-slot:stexid="data">{{data.element.stexid}}</template>
            <template v-slot:stexname="data">{{data.element.stexname}}</template>
            <template v-slot:stcode="data">{{data.element.stcode}}</template>
            <template v-slot:stname="data">{{data.element.stname}}</template>
            <template v-slot:stlisted="data">
                {{data.element.stlisted === null? '' : dateToString(data.element.stlisted)}}
            </template>
            <template v-slot:stdelisted="data">
                {{data.element.stdelisted === null? '' : dateToString(data.element.stdelisted)}}
            </template>
            <template v-slot:stdays="data">{{data.element.stdays}}</template>
            <template v-slot:stpublish="data">
                {{data.element.stpublish === null? '' : dateToString(data.element.stpublish)}}
            </template>
            <template v-slot:stpublishdays="data">{{data.element.stpublishdays}}</template>
            <template v-slot:styear="data">{{data.element.styear}}</template>
            <template v-slot:stperiod="data">{{data.element.stperiod}}</template>
            <template v-slot:stnpel="data">{{data.element.stnpel}}</template>
            <template v-slot:stpbrank="data">
                {{data.element.stpbrank === null? '' : '战胜了' + (data.element.stpbrank * 100).toFixed(2) + '%'}}
            </template>
            <template v-slot:stpbrate="data">
                {{data.element.stpbrate === null? '' : data.element.stpbrate.toFixed(2) + '倍'}}
            </template>
            <template v-slot:stpsrank="data">
                {{data.element.stpsrank === null? '' : '战胜了' + (data.element.stpsrank * 100).toFixed(2) + '%'}}
            </template>
            <template v-slot:stpsrate="data">
                {{data.element.stpsrate === null? '' : data.element.stpsrate.toFixed(2) + '倍'}}
            </template>
            <template v-slot:stperank="data">
                {{data.element.stperank === null? '' : '战胜了' + (data.element.stperank * 100).toFixed(2) + '%'}}
            </template>
            <template v-slot:stperate="data">
                {{data.element.stperate === null? '' : data.element.stperate.toFixed(2) + '倍'}}
            </template>
            <template v-slot:stpcfrank="data">
                {{data.element.stpcfrank === null? '' : '战胜了' + (data.element.stpcfrank * 100).toFixed(2) + '%'}}
            </template>
            <template v-slot:stpcfrate="data">
                {{data.element.stpcfrate === null? '' : data.element.stpcfrate.toFixed(2) + '倍'}}
            </template>
            <template v-slot:stmessage="data">{{data.element.stmessage}}</template>
            <template v-slot:stfavorite="data">{{data.element.stfavorite}}</template>
        </pac-table>
    </pac-form>
</template>

<script lang="ts">
    import {Component, Prop, Vue} from "vue-property-decorator";
    import {PacProgressModel} from "@/components/lib/pac-form/pac-form-model";
    import {PacErrorObj, PacErrorsModel} from "@/components/lib/pac-errors/pac-errors-model";
    import Common from "@/common";
    import {STOCK_SPEC} from "@/components/gen/spec/StockSpec";
    import {PacTableFieldModel, PacTableModel} from "@/components/lib/pac-table/pac-table-model";
    import {FilterItemsModel} from "@/components/lib/pac-table/filter-items-model";
    import {SortModel} from "@/components/lib/pac-table/sort-model";
    import {Stock} from "@/components/gen/bean/Stock";
    import {ContentRange} from "@/components/gen/range";
    import {queryStock} from "@/components/gen/stub/StockStub";
    import {parameters} from "@/components/gen/common";
    import {filterItemsModelToString, numberToString, sortModelToString} from "@/components/lib/pac-common";
    import {dateToString} from "@/components/lib/pac-input/pac-input-common";
    import {MESSAGE_SPEC} from "@/components/gen/spec/MessageSpec";
    import StockInspect from "@/views/stock-inspect.vue";
    import {addFavorite, deleteFavorite} from "@/components/gen/stub/FavoriteStub";
    import {Favorite} from "@/components/gen/bean/Favorite";

    @Component({
        name: 'stock-list',
        components: {StockInspect}
    })
    export default class StockList extends Common {
        loading = true;
        progressModel = new PacProgressModel();
        errorsModel = new PacErrorsModel();
        dateToString = dateToString;
        messageSpec = MESSAGE_SPEC;

        spec = STOCK_SPEC;
        tableModel = new PacTableModel('multiple').appendField(
            new PacTableFieldModel(this.spec.fields.stid.alias.toLowerCase(), this.spec.fields.stid.description, 120, true, true),
            new PacTableFieldModel(this.spec.fields.stexid.alias.toLowerCase(), this.spec.fields.stexid.description, 100, true, true),
            new PacTableFieldModel(this.spec.fields.stexname.alias.toLowerCase(), this.spec.fields.stexname.description, 120, true, true),
            new PacTableFieldModel(this.spec.fields.stcode.alias.toLowerCase(), this.spec.fields.stcode.description, 100, true, true),
            new PacTableFieldModel(this.spec.fields.stname.alias.toLowerCase(), this.spec.fields.stname.description, 140, true, true),
            new PacTableFieldModel(this.spec.fields.stlisted.alias.toLowerCase(), this.spec.fields.stlisted.description, 100, true, true),
            new PacTableFieldModel(this.spec.fields.stdelisted.alias.toLowerCase(), this.spec.fields.stdelisted.description, 100, true, true),
            new PacTableFieldModel(this.spec.fields.stdays.alias.toLowerCase(), this.spec.fields.stdays.description, 100, true, true),
            new PacTableFieldModel(this.spec.fields.stpublish.alias.toLowerCase(), this.spec.fields.stpublish.description, 120, true, true),
            new PacTableFieldModel(this.spec.fields.stpublishdays.alias.toLowerCase(), this.spec.fields.stpublishdays.description, 120, true, true),
            new PacTableFieldModel(this.spec.fields.styear.alias.toLowerCase(), this.spec.fields.styear.description, 100, true, true),
            new PacTableFieldModel(this.spec.fields.stperiod.alias.toLowerCase(), '最近期间', 100, true, true),
            new PacTableFieldModel(this.spec.fields.stnpel.alias.toLowerCase(), this.spec.fields.stnpel.description, 100, true, true),
            new PacTableFieldModel(this.spec.fields.stpbrank.alias.toLowerCase(), '市净率排名', 120, true, true),
            new PacTableFieldModel(this.spec.fields.stpbrate.alias.toLowerCase(), '市净率比率', 120, true, true),
            new PacTableFieldModel(this.spec.fields.stpsrank.alias.toLowerCase(), '市销率排名', 120, true, true),
            new PacTableFieldModel(this.spec.fields.stpsrate.alias.toLowerCase(), '市销率比率', 120, true, true),
            new PacTableFieldModel(this.spec.fields.stperank.alias.toLowerCase(), '市盈率排名', 120, true, true),
            new PacTableFieldModel(this.spec.fields.stperate.alias.toLowerCase(), '市盈率比率', 120, true, true),
            new PacTableFieldModel(this.spec.fields.stpcfrank.alias.toLowerCase(), '市现率排名', 120, true, true),
            new PacTableFieldModel(this.spec.fields.stpcfrate.alias.toLowerCase(), '市现率比率', 120, true, true),
            new PacTableFieldModel(this.spec.fields.stmessage.alias.toLowerCase(), this.spec.fields.stmessage.description, 100, true, true),
            new PacTableFieldModel(this.spec.fields.stfavorite.alias.toLowerCase(), this.spec.fields.stfavorite.description, 100, true, true),
        );

        @Prop({type: Number, required: false, default: 50})
        initPageSize!: number;
        pageSize = this.initPageSize;

        @Prop({type: Number, required: false, default: 1})
        initPageNumber!: number;
        pageNumber = this.initPageNumber;

        @Prop({type: Object, required: false, default: () => new FilterItemsModel(STOCK_SPEC)})
        initFilterItemsModel!: FilterItemsModel;
        filterItemsModel = this.initFilterItemsModel;

        @Prop({type: Object, required: false, default: null})
        initSortModel!: SortModel | null;
        sortModel = this.initSortModel;

        list = new Array<Stock>();
        selection = new Array<Stock>();
        contentRange = new ContentRange();

        previewList = new Array<string>();

        async created(): Promise<void> {
            await this.query();
            this.loading = false;
        }

        async query(): Promise<void> {
            const progress = this.progressModel.start();
            try {
                const {list, contentRange} = await queryStock({
                    filter: this.filterItemsModel.expr,
                    orderBy: this.sortModel?.expr?.only(),
                    pageSize: this.pageSize,
                    pageNumber: this.pageNumber
                });
                this.list = list;
                this.contentRange = contentRange;
            } catch (e) {
                this.errorsModel.set(new PacErrorObj('query', {
                    subject: '远程服务器错误',
                    content: `远程服务器状态：${e.statusCode}`
                }));
            } finally {
                this.progressModel.stop(progress);
            }
        }

        async addFavorite(stock: Stock): Promise<void> {
            const progress = this.progressModel.start();
            try {
                await addFavorite(new Favorite(stock.stid));
                stock.stfavorite = 1;
                Vue.set(this.list, this.list.indexOf(stock), stock)
            } catch (e) {
                this.errorsModel.set(new PacErrorObj('addFavorite', {
                    subject: '远程服务器错误',
                    content: `远程服务器状态：${e.statusCode}`
                }));
            } finally {
                this.progressModel.stop(progress);
            }
        }

        async deleteFavorite(stock: Stock): Promise<void> {
            const progress = this.progressModel.start();
            try {
                await deleteFavorite({fastid: stock.stid as string});
                stock.stfavorite = 0;
                Vue.set(this.list, this.list.indexOf(stock), stock)
            } catch (e) {
                this.errorsModel.set(new PacErrorObj('deleteFavorite', {
                    subject: '远程服务器错误',
                    content: `远程服务器状态：${e.statusCode}`
                }));
            } finally {
                this.progressModel.stop(progress);
            }
        }

        get url(): string {
            return `/${this.$route.name}${parameters(Object({
                filter: filterItemsModelToString(this.filterItemsModel),
                sort: sortModelToString(this.sortModel),
                'page-size': numberToString(this.pageSize),
                'page-number': numberToString(this.pageNumber)
            }))}`;
        }
    }
</script>

<style lang="scss" scoped>
    img.message {
        width: 12px;
        height: 12px;
        /*666666*/
        content: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAABAElEQVQ4T93UwU3DQBAF0P9XO2dSQjqAFmiAS65IMRwsH0CiBCoAJBrYcI9AVII7oATn6rF20Fq2FJwQxeATvq09/2l2vFpioocTOWihLMtmInL6G1RVyxBCxTzPQ4zxwTn3AmAsVtZ1fSsi1wkyM6sAnJO8A7A8srNVjDGQfCU5a6E+aGZX6SWAx0PYvrpvUAqbWTCzlXPuDcDJANyo6qX3fkEy2/62A3XYh5ktB3MrAdyY2TPJs2HHe6EOq1T1QkQWaa2qaxF577a+s/MfoR4j+dSl7g/N7SB05N9ry/45lE718LyMGU+q3bAoinnTNPOxye167/3ntNfIX7rps189DG5FoQfOhwAAAABJRU5ErkJggg==");
        cursor: pointer;

        &:hover {
            /*499ce0*/
            content: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAABEklEQVQ4T92UPU7DQBSEZ/wTKRU+QjgBHAE609CkRQqhBokjcAKIREmkOPQIxAk4AjmBcwRTITnWDtpNkJxgGYe4Yqtd7bxP82aflmhpsSUOHOhokkZdBQd/gX6ymL0N9zPG4zRZSLch+UhwK5ig2UK6Culf8GQ8F4CsMDr2PVwTHDRxJmgKISH5DCD6BrlaUUMaRCDv6mBVujWQg4EJZKYAXkjulYGSPozMmecFfULn5bsfoKU1vOcwg3JuNo+C5jI0/j2Iw03H1aClKstlTjtk3x5y6alD79XmUdV2HcjBRI7shtJNXW6/gZo8oNP8Z1D8kGab89I4mJXQzhfjSdpDgd62xWv6APN2v5Gd3KyKvwAIhHW352HXmwAAAABJRU5ErkJggg==");
        }
    }

    img.preview {
        width: 12px;
        height: 12px;
        /*666666*/
        content: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAyklEQVQ4T82TvQ3CMBCF765IzQiMEHqKZIOMkCI6ZYtkBbronIIR2CCISRgBFvAhCiKHKLJlXODqJN/7/O7HCIkOJuJAOlDbtntr7URE5TAMd9chM1eq2hljDj7n2DRNQUSTtbYcx/H6BeoBoBORhfO6rndZlhUicvnkR4GYefVAMMgt81fQ7CII5NbvCrbizR6FiIMcpQRVANCLSP5usC8OGr9vCd37efyqekbExWaHgFT1YYw5ITMfVfWGiLH/7klEeax4Zfb/QC/g9dVrSuTF7wAAAABJRU5ErkJggg==");
        cursor: pointer;

        &:hover {
            /*499ce0*/
            content: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAA0ElEQVQ4T82TMQrCQBBF52saO29g9gaxt0jAInZeQdicI7mCdZR4BLvEKuI9ZD2CHiCOiAgbiGSIQdxqYee/+bMzA+rpoCcO9QcKM+NShZKGHBQrdbEdLjZmSYw4j9xpm3OEqfEBlMwcFJE62oIwNQmAONduzbmfmfGoIj/Xav+O7wRqSiAG2WV+BbLFIpBd/yexCCQR/xb0/FQmSgqtPMld1P62IbTfX+0nlAzsCFSbbAmIma4HPVljvj3PnPvgBKDT3jHzjRzyOombnP4f6AHBOdT5fz0v3gAAAABJRU5ErkJggg==");
        }
    }

    img.favorite {
        width: 12px;
        height: 12px;
        /*666666*/
        content: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAABIUlEQVQ4T62U0W2DMBCG74zguRsknaDZoGSDbhAqYcQYjIF8SCUjdIKmG6QbkA3yDMJXnVQiICaQKveEbO7z7/t/QHhQ4YM4MAuKouhJDivL8nzr0FmQ1voAAExE23+D4jgOlVJfArDWbouiEKizbioSNYj4Kp3M/ElEb4tBaZqu27ZdIWIIANmoMWPmg+d5pzzPq/7eRZHWOkLEj3tcZOZ3Iiql5wISd4IgkBm8LIT91HUddm4OZnQHbAAZKOpUCMz3/SMirlzKmPnUNM1mnCuna323xjBm/iYiMWJQU6BqShEAVMaY50WgJEm49+L+73nXrRljrgRcLfTSvFdKZV1eJF/WWsnVzpXyqattiOjoGrbW2rk3+9EuzNT8b2Qp6BfDjXcTAGsHmAAAAABJRU5ErkJggg==");
        cursor: pointer;

        &:hover {
            /*499ce0*/
            content: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAABJ0lEQVQ4T62TwVHDMBRE/2IOcKODWBWQDnAOzJgbHYAHmzpcByFjKIFTNMMB00GoQE4H3OCAWUaAMo4jx4aJjl/6T6u/K8iOFnbEkV5QVJgje1mZqNdtl/aCzqamJECdhpN/g+KpiQA8WQDJic5U2QXbqsiqEeDkF/SgM3U+GBQXJgT3R+RnBDJvNhLIgb2S+FjqRFXNvZWieGYuQRR/cZFgoq/Une1Zgaw7B7WUEBwPgVH48h5I5Nxcm9FQWBuypsipsLDDWhYiGPmVcfkWyLidK69rTbc2YOTzPFNRu+4H3ZqqSxFFKp2GaiCoojtI4f3PDHDhavM03BCwUXBp/gYEkru82HxJLbkF+lLufdrpjRk/XquFb9hde72fdkimvPYPbWyf+wKhaHwTr98elQAAAABJRU5ErkJggg==");
        }
    }


    img.non-favorite {
        width: 12px;
        height: 12px;
        /*666666*/
        content: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAABWklEQVQ4T62UzW3CQBCF36zAV0gHpAM6COmAdOADu+JIB0k68NHa9cEl0EFIB3QAHYRcV8gTDdpFwb9RxF5G9tjfvJl5WsKdDt2Jg0HQer2eSbE8z499RXtBaZpOx+PxgYjIez8ry/LUBesFGWPeAFwUAThaa+W59XSCohpmfpE/lVLbPlU3oNVqtVBKPQGYMvMCwLdzTiK01jsAEyKSeGLmnXPuM8q7gowxGwAifSttANh773dxLqIwSRKBzkO7S/neWpsJ7ArSWs+lGjNvnHNl34a01ikRZaLaObe/AQX5g7A2SANUg12rRXW/VDdyrVszxsgwO0HW2mm99QYoDPXLWnvJySYlFkUh24Ixhr33D3VzNkDBAllVVRsiegXwGKofmPldKXXJRXBj/fFFAH2IhwBk0c3B5WKRSVVVz4Og2M75fN7X5Uvbo9FoXoe0bu2/18rgNfJX8A+CzLYTIv/b5QAAAABJRU5ErkJggg==");
        cursor: pointer;

        &:hover {
            /*499ce0*/
            content: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAABcklEQVQ4T63UP1LCQBQG8O8FzNABjTNrJQV/7FKE2ngDvYFHyA3EG+QIHoEbGOukSCdgAZU7YwNUMhHynI0uSIIBHdIlO/t739u3E8KRHjqSg72Q9SzPVbHoQkyKihZC1nhaK8fvY4BoaVbOo0Z99htWCNlD2SMgTcTAJGyL3p+hdRqDbtLNCfpFqbYS2S/SQYJLENeI4TDTPOwIRzn2QPpEXGWCD6YZGfCDpnjSCdeQPXh1QaRa6as2GEa0Mk1fn4tKWIpjh5BYql0GrsHcCztnnsLWUHf0ZjGvfCK4QUs8FE2oO5K3zPCISk7QOo22IPVyCLYLyUHb2KaaTrcplF/bOX57KGc/Y2ehsC1q2dZzkDrUk3gxDdoiXUsnCSBsCj9NPJT8YVbq2cuZg9RGSthjg1yscAeg8V19jBLu9ZqGc+PXH74gPDIwB+Dp26xuOQCXgCobuNoL6XaW5UqUjZ/e9uXCyiI7p/bf38re38ih8Ce/JbkTzInKPQAAAABJRU5ErkJggg==");
        }
    }
</style>