import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaultDesign,designSchema,designCss,orderDesigns} from '../lib/site-design';
test('production defaults retain the original sections, flow and colors',()=>{
 assert.deepEqual(defaultDesign.home_sections,['hero','sizes','gallery','how']);
 assert.equal(defaultDesign.primary,'#253b32');
 assert.equal(defaultDesign.checkout_layout,'one_page');
 assert.equal(defaultDesign.product_entry,'details_first');
 assert.equal(defaultDesign.font,'classic');
});
test('production editor rejects experimental-only features and unsafe styles',()=>{
 for(const patch of [{product_entry:'customize_first'},{size_selection:'in_customizer'},{home_sections:['gallery','rewards']},{font:'url(evil)'},{primary:'#fff;display:none'},{ink:'#ffffff'},{home_sections:['hero']}])
  assert.equal(designSchema.safeParse({...defaultDesign,...patch}).success,false);
 const d=designSchema.parse({...defaultDesign,mobile_columns:1,desktop_columns:3,image_fit:'contain',font:'playful'});
 assert.match(designCss(d),/repeat\(3,minmax/);
 assert.match(designCss(d),/object-fit:contain/);
});
test('explicit product ordering retains unlisted and future designs',()=>{
 const groups=['a','b','c'].map(id=>({product:{id,design_slug:null}}));
 assert.deepEqual(orderDesigns(groups,['b']).map(x=>x.product.id),['b','a','c']);
});
