// Chapter-title keys survive syllabus reordering. These are supplemental activities,
// not claims about official practicals or current textbook editions.
window.CLASSROOM_ACTIVITIES = (() => {
  const entries = {};
  function add(chapters, kind, title, prompt) {
    chapters.forEach(chapter => { (entries[chapter] ??= []).push({kind,title,prompt}); });
  }
  add(['Our Food','The Food We Need','Food Components','Food for Health'], 'Paper activity', 'Trace the ingredients', 'Choose a dish such as idli or dal. List its ingredients, then trace each to a plant or animal source. For the nutrition chapters, use textbook charts to identify which ingredients supply carbohydrates, protein or fat.');
  add(['What Do Animals Eat?','Animals and Their Food','Nutrition in Organisms'], 'Paper model', 'Match examples of foods', 'Use pictures or textbook examples to match a cow with grass, a barn owl with a mouse and a crow with more than one kind of food. Sort the animals by their usual diet. Explain why one example food is not a complete diet.');
  add(['Habitat','Organisms and Habitat','Forest – Our Life'], 'Observation', 'Compare two places', 'From a safe spot, observe a shaded patch and a sunny patch at school for two minutes each. Sketch two similarities and two differences in what you see. Do not pick up animals or disturb their homes.');
  add(['Fibre to Fabric','How Fabrics Are Made','Animal Fibre','Fibres and Fabrics'], 'Paper model', 'Weave a pattern', 'Use precut paper strips to make an over-under weave. Draw a second design that goes over two strips at a time. Compare the patterns and use your textbook to trace a fibre, such as cotton or wool, from source to fabric.');
  add(['Plants: Parts and Functions','Knowing About Plants'], 'Observation', 'Follow the leaf veins', 'Sketch a fallen leaf without picking live plants. Label the stalk, blade and veins, then compare the vein pattern with a textbook picture of another leaf.');
  add(['Water in Our Life','Water – Too Little to Waste'], 'Data activity', 'Find a way to save water', 'Imagine a tap drips once every two seconds. Estimate the number of drips in a minute and an hour without running a real tap. List one way to prevent that loss.');
  add(['Movements in Animals','Movement and Locomotion'], 'Paper model', 'Compare joints', 'Overlap two pieces of card and join them at one point with a teacher-prepared paper fastener. Move the model and compare it with a picture of an elbow. Why can a shoulder move in more directions?');
  add(['Living and Non-living'], 'Paper activity', 'Is movement enough?', 'Sort pictures of a seedling, a rolling ball and a dog. Use growth, response and other signs from the chapter to explain why movement alone does not prove that something is alive.');
  add(['Weather and Climate'], 'Data activity', 'Weather today or climate?', 'Use five daily temperatures from an official forecast or teacher-provided table and plot them. Compare with a published monthly average. Why are five days not enough to describe a place’s climate?');
  add(['Nutrition in Plants'], 'Paper model', 'Where does a plant get its materials?', 'Draw a green plant. Use arrows to show where water and carbon dioxide come from and where light reaches the leaf. Use the model to explain why sunlight is an energy source, not a material.');
  add(['Respiration in Organisms','Respiration and Circulation'], 'Paper model', 'Follow oxygen', 'Arrange cards for air, lungs, blood and body cells. Draw arrows to show where oxygen goes. Compare breathing, transport in the blood and release of usable energy in cells.');
  add(['Reproduction in Plants'], 'Paper model', 'Sequence a flowering plant', 'Put cards for seed, seedling, flowering plant and fruit containing seeds in order. Mark where pollination fits and explain why pollination is not the same event as germination.');
  add(['Seed Dispersal'], 'Model experiment', 'Does a paper wing slow a fall?', 'Compare a plain paper shape with an equal-mass paper shape folded into a wing. Drop them indoors from the same low height, repeat three times and note which lands first. These shapes model seeds; they are not real seeds.');
  add(['Soil – Our Life','Soil and Water'], 'Data activity', 'Compare drainage', 'Use these sample measurements: after 5 minutes, 80 mL drained through sand and 20 mL through clay when each sample received 100 mL. Draw a bar chart. What would you need to keep the same in a fair comparison?');
  return entries;
})();
