import {createResolver, invalidate, resolve} from '@convey/core';
import {useResolver} from '@convey/react';

import {getServerDate, getHello} from '../resolvers/server/example';

const getData1 = createResolver(async function (id: number) {
    console.log('call', 'getData1', id);
    return `${id}: ${Math.random()}`;
});

const getData = createResolver(async function (id: number) {
    console.log('call', 'getData', id);
    return await getData1(id);
});

const getDateTest = createResolver(async function () {
    return await getServerDate();
});

export default function Simple() {
    const [hello] = useResolver(getHello('world'));
    const [serverDate] = useResolver(getServerDate());
    const [dateTest] = useResolver(getDateTest());

    const [data1] = useResolver(getData(1));
    const [data2] = useResolver(getData(2));

    return (
        <div>
            <p>{hello}</p>
            <p>Server date stream: {serverDate}</p>
            <p>Server date test: {dateTest}</p>

            <p>random 1: {data1}</p>
            <p>random 2: {data2}</p>

            <button
                onClick={() => {
                    invalidate(getData1(1));
                }}
            >
                update
            </button>
        </div>
    );
}
