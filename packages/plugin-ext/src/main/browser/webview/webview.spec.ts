// *****************************************************************************
// Copyright (C) 2026 TypeFox and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import { enableJSDOM } from '@theia/core/lib/browser/test/jsdom';
let disableJSDOM = enableJSDOM();

import * as chai from 'chai';
import { blurActiveElementOutside } from './webview';

disableJSDOM();

const expect = chai.expect;

// Regression test for https://github.com/eclipse-theia/theia/issues/15311
//
// Webviews only emulate DOM focus on their host node instead of really transferring it, so
// the previously focused element (e.g. a Monaco editor's hidden textarea) never lost real DOM
// focus. That meant Monaco's `editorTextFocus` context stayed `true`, so keybindings such as
// Ctrl+A kept firing against the stale editor in addition to whatever the webview itself did
// with the keystroke.
describe('WebviewWidget#blurActiveElementOutside', () => {

    before(() => {
        disableJSDOM = enableJSDOM();
    });

    after(() => {
        disableJSDOM();
    });

    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        container.remove();
        // Reset focus between tests so leftover focus doesn't leak across cases.
        (document.activeElement as HTMLElement | null)?.blur();
    });

    it('blurs an element that is focused outside of the container', () => {
        const outside = document.createElement('input');
        document.body.appendChild(outside);
        outside.focus();
        expect(document.activeElement).to.equal(outside);

        blurActiveElementOutside(container);

        expect(document.activeElement).to.not.equal(outside);
        outside.remove();
    });

    it('does not blur an element that is focused inside the container', () => {
        const inside = document.createElement('input');
        container.appendChild(inside);
        inside.focus();
        expect(document.activeElement).to.equal(inside);

        blurActiveElementOutside(container);

        expect(document.activeElement).to.equal(inside);
    });

    it('does not blur the container itself', () => {
        container.tabIndex = 0;
        container.focus();
        expect(document.activeElement).to.equal(container);

        blurActiveElementOutside(container);

        expect(document.activeElement).to.equal(container);
    });

    it('does nothing when nothing is focused outside the body', () => {
        expect(document.activeElement).to.equal(document.body);

        expect(() => blurActiveElementOutside(container)).to.not.throw();
        expect(document.activeElement).to.equal(document.body);
    });
});
