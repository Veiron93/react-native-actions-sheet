import React, { useEffect, useReducer, useState } from "react";
import { actionSheetEventManager } from "./eventmanager";
import { SheetManager } from "./sheetmanager";
/**
 * An object that holds all the sheet components against their ids.
 */
var sheetsRegistry = {};
// Registers your Sheet with the SheetProvider.
export function registerSheet(id, Sheet, context) {
    if (!id || !Sheet)
        return;
    context = context || "global";
    var registry = !sheetsRegistry[context]
        ? (sheetsRegistry[context] = {})
        : sheetsRegistry[context];
    registry[id] = Sheet;
    actionSheetEventManager.publish("".concat(context, "-on-register"));
}
/**
 * The SheetProvider makes available the sheets in a given context. The default context is
 * `global`. However if you want to render a Sheet within another sheet or if you want to render
 * Sheets in a modal. You can use a seperate Provider with a custom context value.
 *
 * For example
```ts
// Define your SheetProvider in the component/modal where
// you want to show some Sheets.
<SheetProvider context="local-context" />

// Then register your sheet when for example the
// Modal component renders.

registerSheet('local-sheet', LocalSheet,'local-context');

```
 * @returns
 */
function SheetProvider(_a) {
    var _b = _a.context, context = _b === void 0 ? "global" : _b, children = _a.children;
    var _c = useReducer(function (x) { return x + 1; }, 0), forceUpdate = _c[1];
    var sheetIds = Object.keys(sheetsRegistry[context] || {});
    var onRegister = React.useCallback(function () {
        // Rerender when a new sheet is added.
        forceUpdate();
    }, [forceUpdate]);
    useEffect(function () {
        var unsub = actionSheetEventManager.subscribe("".concat(context, "-on-register"), onRegister);
        return function () {
            unsub === null || unsub === void 0 ? void 0 : unsub.unsubscribe();
        };
    }, [onRegister]);
    var renderSheet = function (sheetId) { return (<RenderSheet key={sheetId} id={sheetId} context={context}/>); };
    return (<>
      {children}
      {sheetIds.map(renderSheet)}
    </>);
}
var RenderSheet = function (_a) {
    var id = _a.id, context = _a.context;
    var _b = useState(), payload = _b[0], setPayload = _b[1];
    var _c = useState(false), visible = _c[0], setVisible = _c[1];
    var Sheet = sheetsRegistry[context] && sheetsRegistry[context][id];
    if (!Sheet)
        return null;
    var onShow = function (data) {
        setPayload(data);
        setVisible(true);
    };
    var onClose = function () {
        setVisible(false);
        setPayload(undefined);
    };
    useEffect(function () {
        var _a, _b;
        if (visible) {
            (_b = (_a = SheetManager.get(id)) === null || _a === void 0 ? void 0 : _a.current) === null || _b === void 0 ? void 0 : _b.show();
        }
    }, [visible]);
    useEffect(function () {
        var subs = [
            actionSheetEventManager.subscribe("show_".concat(id), onShow),
            actionSheetEventManager.subscribe("onclose_".concat(id), onClose),
        ];
        return function () {
            subs.forEach(function (s) { return s.unsubscribe(); });
        };
    }, [id, context]);
    return !visible ? null : <Sheet sheetId={id} payload={payload}/>;
};
export default SheetProvider;