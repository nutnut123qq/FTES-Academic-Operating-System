/**
 * Interface for components that can have class names.
 */
export interface WithClassNames<T> {
    /**
     * Class names object.
     */
    classNames?: T
    /**
     * Class name string.
     */
    className?: string
}