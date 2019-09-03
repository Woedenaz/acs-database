/* eslint-disable no-cond-assign */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable indent */
/* eslint-disable no-tabs */
/* eslint-disable no-var */
/* exported log */
// add event cross browser

"use strict";

const acsTable = $("#table tbody");
const acsTableParent = $("#table");

$(document).ready( function() {

    $("table").floatThead();

    $(acsTableParent).bootstrapTable("refresh");    
});



