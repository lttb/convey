import {createResolver, invalidate, resolve} from '@convey/core';
import {useResolver} from '@convey/react';

import {
    getServerDate,
    getHello,
    getUserName,
    setUserName,
} from '../resolvers/server/example';

const getOffer = createResolver(async function getOffer (id: number) {
    console.log('call', 'getDataById', id);
    return `${id}: ${Math.random()}`;
});

const getTotalPrice = createResolver(async function getTotalPrice(id: number) {
    console.log('call', 'getData', id);
    const result = await Promise.all([
        getOffer(id),
        getOffer(id + 1),
    ]);
    return result.join(' ');
});

const getCart = createResolver(async function getCart () {
    console.log('go 1');
    const data1 = await getOffer(1)
    console.log('go 2');
    const data2 = await getOffer(2);
    console.log('go 3');
    return (await getServerDate()) + data1 + data2;
});

export default function Simple() {
    console.log('render');
    // const [hello] = useResolver(getHello('world'));
    const [serverDate] = useResolver(getServerDate());
    const [dateTest] = useResolver(getCart());
    // const [userName] = useResolver(getUserName());

    const [data1] = useResolver(getTotalPrice(5));
    // const [data2] = useResolver(getData(2));

    return (
        <div>
            <p>Server date test: {dateTest}</p>
            <p>Server date test 1: {data1}</p>

            <button
                onClick={() => {
                    invalidate(getOffer(1));
                }}
            >
                update
            </button>

            <button
                onClick={async () => {
                    await setUserName('Alex');
                }}
            >
                update user name
            </button>
        </div>
    );
}
