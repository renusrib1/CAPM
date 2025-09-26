sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",

], function (Controller, MessageBox, Fragment, MessageToast, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("project1.controller.View1", {
        onInit: function () {
        },

        submit: function () {
            var title = this.getView().byId("title").getValue();
            var author = this.getView().byId("author").getValue();

            // ensure backend Decimal/Integer types receive numbers
            var price = parseFloat(this.getView().byId("price").getValue()) || 0;
            var stock = parseInt(this.getView().byId("stock").getValue(), 10) || 0;

            var location = this.getView().byId("location").getValue();
            var gender = this.getView().byId("gender").getValue();
            var oModel = this.getView().getModel();

            var oContext = oModel.bindList("/Books").create({
                "title": title,
                "author": author,
                "price": price,
                "stock": stock,
                "location": location,
                "gender": gender
            });

            oContext.created().then(() => {
                MessageBox.success("Product added successfully");
                this.getView().byId("title").setValue("");
                this.getView().byId("author").setValue("");
                this.getView().byId("price").setValue("");
                this.getView().byId("stock").setValue("");
                this.getView().byId("location").setValue("");
                this.getView().byId("gender").setValue("");
            }).catch((err) => {
                MessageBox.error("Error adding new product");
                console.error("Error adding item: " + err);
            });
        },

        onCollapseExpandPress: function () {
            const oSideNavigation = this.byId("sideNavigation"),
                bExpanded = oSideNavigation.getExpanded();

            oSideNavigation.setExpanded(!bExpanded);
        },

        onBookPressed: function () {
            this.hideAllPanel();
            var oPanel = this.byId("Panel1");
            oPanel.setVisible(true);
        },

        onViewDetailsAddBookPress: function () {
            this.hideAllPanel();
            var oPanel = this.byId("Panel2");
            oPanel.setVisible(true);
        },

        onEditPressed: function () {
            this.hideAllPanel();
            var oPanel = this.byId("Panel3");
            oPanel.setVisible(true);
        },

        hideAllPanel: function () {
            this.byId("Panel1").setVisible(false);
            this.byId("Panel2").setVisible(false);
            this.byId("Panel3").setVisible(false);
        },

        onActionPressed: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext();
            this._oSelectedContext = oContext;

            if (!this._oActionSheet) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "project1.view.ActionSheet",
                    controller: this
                }).then(function (oActionSheet) {
                    this._oActionSheet = oActionSheet;
                    this.getView().addDependent(this._oActionSheet);
                    this._oActionSheet.openBy(oButton);
                }.bind(this));
            } else {
                this._oActionSheet.openBy(oButton);
            }
        },

        onaction1press: function () {
            var oData = this._oSelectedContext.getObject();
            MessageBox.information("View Details of: " + oData.title);
        },

        onaction2press: function () {
            var oContext = this._oSelectedContext;
            var sBookId = oContext.getProperty("ID");

            MessageBox.confirm("Are you sure you want to delete this book with ID: " + sBookId + "?", {
                actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                onClose: function (oAction) {
                    if (oAction === MessageBox.Action.YES) {
                        oContext.delete("$direct").then(function () {
                            MessageBox.success("Book ID: " + sBookId + " deleted successfully.");
                        }).catch(function (oError) {
                            MessageBox.error("Error deleting book ID: " + sBookId + " : " + oError + " Please try again.");
                        });
                    }
                }
            });
        },

        onEditPress: function () {
            var oData = this._oSelectedContext.getObject();
            MessageToast.show("Edit action for item id: " + oData.ID);
            this.onEditPressed();

            var product_model = this.getOwnerComponent().getModel();
            let aFilters = [
                new Filter("ID", FilterOperator.EQ, oData.ID)
            ];
            let oBinding = product_model.bindList("/Books");
            oBinding.filter(aFilters);
            oBinding.requestContexts().then((aContexts) => {
                if (aContexts.length > 0) {
                    aContexts.forEach((oContext) => {
                        let oUser = oContext.getObject();
                        this.getView().byId("ttle").setValue(oUser.title);
                        this.getView().byId("authr").setValue(oUser.author);
                        this.getView().byId("ice").setValue(oUser.price);
                        this.getView().byId("stok").setValue(oUser.stock);
                        this.getView().byId("locaton").setValue(oUser.location);
                        this.getView().byId("geder").setValue(oUser.gender);
                        this.getView().byId("itemCode").setValue(oUser.ID);
                    });
                } else {
                    MessageBox.error("NO book has found");
                }
            }).catch((oError) => { MessageBox.error("Error retrieving book details" + oError); });
        },

        updateItem: function () {
            var itemCode = (this.getView().byId("itemCode").getValue() || "").trim();
            var tite = this.getView().byId("ttle").getValue();
            var author = this.getView().byId("authr").getValue();

            // send price/stock as numbers
            var price = parseFloat(this.getView().byId("ice").getValue()) || 0;
            var stock = parseInt(this.getView().byId("stok").getValue(), 10) || 0;

            var location = this.getView().byId("locaton").getValue();
            var gender = this.getView().byId("geder").getValue();
            var update_oModel = this.getView().getModel();

            // ---- FIX: correct entity path (pick numeric or string key) ----
            // If ID is numeric:
            var spath = "/Books(" + itemCode + ")";
            // If your ID is actually a string, comment the previous line and use:
            // var spath = "/Books('" + itemCode + "')";

            var oContext = update_oModel.bindContext(spath).getBoundContext();

            // ensure changes are collected/submitted in $auto group
            oContext.setUpdateGroupId("$auto");

            var oView = this.getView();
            function resetBusy() { oView.setBusy(false); }
            oView.setBusy(true);

            oContext.setProperty("title", tite);
            oContext.setProperty("author", author);
            oContext.setProperty("price", price);
            oContext.setProperty("stock", stock);
            oContext.setProperty("location", location);
            oContext.setProperty("gender", gender);

            // ---- FIX: submit the correct batch group ----
            update_oModel.submitBatch("$auto").then(function () {
                resetBusy();
                MessageBox.success("Item details updated successfully");
                // If the table doesn't auto-refresh, uncomment one of these:
                // update_oModel.refresh();
                // this.byId("<yourTableId>").getBinding("items").refresh();
            }.bind(this)).catch(function (err) {
                resetBusy();
                MessageBox.error("error" + err);
            });
        }



        
    });
});
