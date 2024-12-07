"use client"
import React from 'react'
import Link from 'next/link';


const Navbar = () => {
  return (
    <nav className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
      <Link href='/' className='navbar-button'>Home</Link>
      <Link href='/about' className='navbar-button'>About</Link>
      <Link href='/download' className='navbar-button'>Download</Link>
      <Link href='https://github.com/Sherylleong/NTUFreeFood-StatTracker' className='navbar-button'>Github</Link>
      </div>
    </nav>
  )
}

export default Navbar
