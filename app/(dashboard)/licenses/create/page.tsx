import React from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import MultiStepForm from './multi-step-form/multi-step-form'

const page = () => {
    return (
        <main>
            <div className='flex items-center justify-between my-5 mx-8'>
                <h1 className="font-semibold text-xl text-gray-800 dark:text-gray-200">Create New License</h1>
                <Link href={'/licenses'} className='flex items-center bg-indigo-700 text-white text-sm px-4 py-2 rounded-md hover:bg-indigo-800'>
                    <ArrowLeft className='mr-2' />
                    <span>Back to Licenses</span>
                </Link>
            </div>
            <div>
                <MultiStepForm />
            </div>
        </main>
    )
}

export default page