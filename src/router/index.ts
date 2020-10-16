import Vue from 'vue'
import VueRouter, {Route, RouteConfig} from 'vue-router'
import {v4} from "uuid";
import {STOCK_SPEC} from "@/components/gen/spec/StockSpec";
import {stringToFilterItemsModel, stringToNumber, stringToSortModel} from "@/components/lib/pac-common";
import {TRADINGDATE_SPEC} from "@/components/gen/spec/TradingDateSpec";
import {EXCHANGE_SPEC} from "@/components/gen/spec/ExchangeSpec";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [{
    name: 'exchange-list',
    path: '/exchange-list',
    component: () => import('@/views/exchange-list.vue'),
    props: (route: Route) => Object({
        initFilterItemsModel: stringToFilterItemsModel(EXCHANGE_SPEC, route.query['filter'] as string),
        initSortModel: stringToSortModel(route.query['sort'] as string),
        initPageSize: stringToNumber(route.query['page-size'] as string),
        initPageNumber: stringToNumber(route.query['page-number'] as string)
    })
}, {
    name: 'trading-date-list',
    path: '/trading-date-list',
    component: () => import('@/views/trading-date-list.vue'),
    props: (route: Route) => Object({
        initFilterItemsModel: stringToFilterItemsModel(TRADINGDATE_SPEC, route.query['filter'] as string),
        initSortModel: stringToSortModel(route.query['sort'] as string),
        initPageSize: stringToNumber(route.query['page-size'] as string),
        initPageNumber: stringToNumber(route.query['page-number'] as string)
    })
}, {
    name: 'stock-list',
    path: '/stock-list',
    component: () => import('@/views/stock-list.vue'),
    props: (route: Route) => Object({
        initFilterItemsModel: stringToFilterItemsModel(STOCK_SPEC, route.query['filter'] as string),
        initSortModel: stringToSortModel(route.query['sort'] as string),
        initPageSize: stringToNumber(route.query['page-size'] as string),
        initPageNumber: stringToNumber(route.query['page-number'] as string)
    })
}, {
    name: 'stock-inspect',
    path: '/stock-inspect/:stid',
    component: () => import('@/views/stock-inspect.vue'),
    props: (route: Route) => Object({
        initStid: route.params['stid']
    })
}];

const router = new VueRouter({
    mode: 'history',
    base: process.env.BASE_URL,
    routes
});

router.beforeEach((to, from, next) => {
    if (to.query['uuid'] === undefined) {
        to.query['uuid'] = v4();
        next({path: to.path, query: to.query, params: to.params});
    } else
        next();
});

export default router
