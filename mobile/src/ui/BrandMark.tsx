import React from 'react';
import Svg,{Path,Rect} from 'react-native-svg';
import {C} from './theme';
export function BrandMark({size=30}:{size?:number}) {return <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityLabel="VoluForge"><Rect width="48" height="48" rx="14" fill={C.orange}/><Path d="M8 13h7l6 17 6-17h7L23 37h-5L8 13Z" fill={C.bg}/><Path d="M29 13h12v6h-8v5h6v6h-6v7h-6V21l2-8Z" fill={C.bg}/></Svg>;}
