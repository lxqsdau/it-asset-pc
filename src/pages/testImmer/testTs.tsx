import * as React from 'react';
export default class TestImmer extends React.Component<any, any> {
    state = {
        complete: "123"
    }
    render() {
        return (
            <div>{this.state.complete}</div>
        )
    }
}



