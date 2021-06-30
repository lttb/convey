import {useResolver} from '@convey/react';

import {getServerDate, getHello} from '../resolvers/server/example';

export default function Simple() {
    const [hello] = useResolver(getHello('world'));
    const [serverDate] = useResolver(getServerDate());

    return (
        <div>
            <p>{hello}</p>
            <p>Server date stream: {serverDate}</p>
        </div>
    );
}
