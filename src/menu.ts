import {PacMenuItemModel} from "@/components/lib/pac-menu/pac-menu-model";
import {STOCK_SPEC} from "@/components/gen/spec/StockSpec";
import {FilterLogicExpr} from "@/components/gen/filter";
import {encode} from "universal-base64";
import {OrderByExpr} from "@/components/gen/order";

export default [
    new PacMenuItemModel('沪深A股').append(
        new PacMenuItemModel('全部', '/stock-list'),
        new PacMenuItemModel('低估值', '/stock-list'
            + `?filter=${encode(new FilterLogicExpr()
                .isEmpty(STOCK_SPEC.fields.stdelisted.alias.toLowerCase())
                .geNumber(STOCK_SPEC.fields.stnpel.alias.toLowerCase(), 24)
                .ltNumber(STOCK_SPEC.fields.stpbrank.alias.toLowerCase(), 0.5)
                .gtNumber(STOCK_SPEC.fields.stpbrate.alias.toLowerCase(), 0)
                .ltNumber(STOCK_SPEC.fields.stpbrate.alias.toLowerCase(), 1)
                .ltNumber(STOCK_SPEC.fields.stpsrank.alias.toLowerCase(), 0.5)
                .gtNumber(STOCK_SPEC.fields.stpsrate.alias.toLowerCase(), 0)
                .ltNumber(STOCK_SPEC.fields.stpsrate.alias.toLowerCase(), 1)
                .ltNumber(STOCK_SPEC.fields.stperank.alias.toLowerCase(), 0.5)
                .gtNumber(STOCK_SPEC.fields.stperate.alias.toLowerCase(), 0)
                .ltNumber(STOCK_SPEC.fields.stperate.alias.toLowerCase(), 1)
                .ltNumber(STOCK_SPEC.fields.stpcfrank.alias.toLowerCase(), 0.5)
                .gtNumber(STOCK_SPEC.fields.stpcfrate.alias.toLowerCase(), 0)
                .ltNumber(STOCK_SPEC.fields.stpcfrate.alias.toLowerCase(), 1).toString())}`
            + `&sort=${new OrderByExpr(STOCK_SPEC.fields.stpsrank.alias.toLowerCase(), true).toString()}`)
    ),
    new PacMenuItemModel('宏观经济')
];