import test from "node:test";
import assert from "node:assert/strict";
import {
    isChinaValue,
    isHongKongCoordinate,
    isHongKongDistrict,
    isHongKongText,
    isHongKongValue,
    shouldNormalizeHongKongLocation,
} from "./hongKongDetection.js";

test("detects Hong Kong aliases and text signals", () => {
    assert.equal(isHongKongValue("Hong Kong SAR"), true);
    assert.equal(isHongKongValue("HK$"), true);
    assert.equal(isHongKongText("Hong Kong Island"), true);
    assert.equal(isHongKongDistrict("Kowloon"), true);
});

test("does not treat generic China signals as Hong Kong", () => {
    assert.equal(isChinaValue("China"), true);
    assert.equal(isHongKongValue("China"), false);
    assert.equal(isHongKongDistrict("Shanghai"), false);
});

test("normalizes Hong Kong when China payload has Hong Kong timezone", () => {
    assert.equal(
        shouldNormalizeHongKongLocation({
            countryCode: "CN",
            countryName: "China",
            regionCode: "",
            regionName: "",
            cityName: "",
            timeZoneId: "Asia/Hong_Kong",
            timeZoneAbbreviation: "HKT",
            currencyCode: "CNY",
            currencySymbol: "¥",
            latitude: 22.3193,
            longitude: 114.1694,
        }),
        true
    );
});

test("does not normalize mainland China coordinates without Hong Kong signals", () => {
    assert.equal(isHongKongCoordinate(31.2304, 121.4737), false);
    assert.equal(
        shouldNormalizeHongKongLocation({
            countryCode: "CN",
            countryName: "China",
            regionCode: "SH",
            regionName: "Shanghai",
            cityName: "Shanghai",
            timeZoneId: "Asia/Shanghai",
            timeZoneAbbreviation: "CST",
            currencyCode: "CNY",
            currencySymbol: "¥",
            latitude: 31.2304,
            longitude: 121.4737,
        }),
        false
    );
});
