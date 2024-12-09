"use client"
import {NextUIProvider} from '@nextui-org/react'
import { APIProvider} from '@vis.gl/react-google-maps';

export function Providers({children}: { children: React.ReactNode }) {
  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GMAPAPIKEY as string}>
      <NextUIProvider>
        {children}
      </NextUIProvider>
    </APIProvider>
  )
}