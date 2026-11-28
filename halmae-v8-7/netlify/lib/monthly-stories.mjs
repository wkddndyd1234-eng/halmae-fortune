import {moonManuscript} from '../functions/story-manuscript.mjs';

export function monthlyStory(f,index,chapter){
 const story=moonManuscript(f,index);
 return {
  title:chapter.displayTitle,
  intro:[story.opening,story.prelude],
  sections:[story.outlook,story.money,story.work,story.business,story.connection,story.closing]
   .map((paragraph,i)=>({title:chapter.groups[i].title,paragraphs:[paragraph]})),
 };
}
