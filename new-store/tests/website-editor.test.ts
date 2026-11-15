
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {designSchema,defaultDesign,designCss,onColor,contrast} from '../lib/site-design';
test('website settings restrict layout and flow to supported values',()=>{
 assert.equal(designSchema.safeParse({...defaultDesign,desktop_columns:4}).success,false);
 assert.equal(designSchema.safeParse({...defaultDesign,home_sections:['how']}).success,false);
 assert.equal(designSchema.safeParse({...defaultDesign,home_sections:['gallery','gallery']}).success,false);
 assert.equal(designSchema.safeParse({...defaultDesign,disable_payment:true}).success,false);
 assert.equal(designSchema.safeParse({...defaultDesign,checkout_layout:'skip_payment'}).success,false);
});
test('color inputs cannot introduce CSS and text must remain readable',()=>{
 assert.equal(designSchema.safeParse({...defaultDesign,primary:'#fff;display:none'}).success,false);
 assert.equal(designSchema.safeParse({...defaultDesign,ink:'#ffffff'}).success,false);
 assert.equal(onColor('#ffffff'),'#231527');
 assert.equal(onColor('#000000'),'#ffffff');
 assert.ok(contrast(defaultDesign.ink,defaultDesign.background)>=4.5);
});
test('design CSS uses validated colors and fixed selectors, not arbitrary code',()=>{
 const d=designSchema.parse({...defaultDesign,primary:'#71408e',mobile_columns:2,customizer_order:'preview_first'});
 const css=designCss(d);
 assert.ok(css.includes('#71408e'));
 assert.ok(css.includes('repeat(2,minmax(0,1fr))'));
 assert.ok(css.includes('studio-customizer>div{order:1}'));
 assert.ok(!css.includes('javascript:'));
});
