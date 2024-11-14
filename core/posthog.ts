//import posthog from 'posthog-js'


import posthog from 'posthog-js/dist/module.full.no-external'

posthog.init('phc_Kx915GiGlAxeIzwWrQjJES94boCJbSCiBbRDykXI35N',
    {
        api_host: 'https://us.i.posthog.com',
        person_profiles: 'identified_only' // or 'always' to create profiles for anonymous users as well
    }
)

export default posthog
