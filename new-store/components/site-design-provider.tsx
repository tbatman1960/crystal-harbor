
'use client';
import {createContext,useContext} from 'react';
import {defaultDesign,type SiteDesign} from '@/lib/site-design';
const Context=createContext<SiteDesign>(defaultDesign);
export function SiteDesignProvider({value,children}:{value:SiteDesign;children:React.ReactNode}){return <Context.Provider value={value}>{children}</Context.Provider>}
export function useSiteDesign(){return useContext(Context)}
