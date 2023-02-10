import {useResolver} from '@convey/react';

import {getServerDate} from '@examples/nextjs/resolvers/server/example-1';

export default function Simple() {
    const [serverDate] = useResolver(getServerDate());

    return (
        <div>
            <p>Result: {serverDate}</p>
        </div>
    );
}
